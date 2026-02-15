import { handleSendMessage, handleStartGame } from "@/interfaces/api/chat-handler";
import { handleApiError } from "@/interfaces/errors/api-error-handler";
import type { ErrorResponse } from "@/interfaces/schemas/chat";
import { chatRequestSchema, chatSuccessResponseSchema } from "@/interfaces/schemas/chat";
import { messageService } from "@/infrastructure/messages-container";
import { pointService } from "@/infrastructure/points-container";
import { getServerSession } from "@/lib/auth/server-session";
import { logger } from "@/utils/logger";
import { after, NextResponse } from "next/server";

const POINT_PERSIST_SYNC_RETRY_COUNT = 1;
const POINT_PERSIST_BACKGROUND_RETRY_COUNT = 3;

function maskUserId(userId: string): string {
  if (userId.length <= 10) return userId;
  return `${userId.slice(0, 6)}...${userId.slice(-4)}`;
}

async function addPointsWithRetry(
  input: { userId: string; amount: number; idempotencyKey: string },
  retryCount: number,
) {
  let lastError: unknown;

  for (let attempt = 1; attempt <= retryCount; attempt++) {
    try {
      const pointsView = await pointService.addMyPoints({
        userId: input.userId,
        amount: input.amount,
        reason: "chat",
        idempotencyKey: input.idempotencyKey,
      });
      logger.debug("[chat] point persist success", {
        attempt,
        retryCount,
        amount: input.amount,
      });
      return pointsView;
    } catch (error) {
      lastError = error;
      if (attempt < retryCount) {
        logger.warn(`[chat] point persist retry ${String(attempt)} failed`, error);
      }
    }
  }

  throw lastError;
}

export async function POST(request: Request) {
  try {
    let json: unknown;
    try {
      json = await request.json();
    } catch {
      return NextResponse.json(
        { type: "error", code: "INVALID_JSON", message: "Request body is not valid JSON" } satisfies ErrorResponse,
        { status: 400 },
      );
    }
    const body = chatRequestSchema.parse(json);

    const session = await getServerSession();
    const userId = session?.user.id;
    if (!userId) {
      return NextResponse.json(
        { type: "error", code: "UNAUTHORIZED", message: "Unauthorized" } satisfies ErrorResponse,
        {
          status: 401,
        },
      );
    }

    if (body.isInit) {
      logger.info("[chat] start request", {
        userId: maskUserId(userId),
        locale: body.locale,
        usernameLength: body.username.length,
      });
      const { response, backgroundTask } = await handleStartGame(userId, body.username, body.locale);
      if (backgroundTask) {
        after(backgroundTask);
      }
      logger.info("[chat] start response", {
        userId: maskUserId(userId),
        sessionId: response.sessionId,
        characterType: response.characterType,
        remainingChats: response.remainingChats,
      });
      return NextResponse.json(chatSuccessResponseSchema.parse(response));
    }

    logger.info("[chat] message request", {
      userId: maskUserId(userId),
      sessionId: body.sessionId,
      locale: body.locale,
    });
    logger.debug("[chat] message request details", {
      sessionId: body.sessionId,
      clientMessageId: body.clientMessageId,
      messageLength: body.message.length,
    });

    const response = await handleSendMessage(body.sessionId, body.message, body.locale);
    logger.info("[chat] message response", {
      sessionId: body.sessionId,
      type: response.type,
      remainingChats: response.remainingChats,
    });

    if (response.type === "message") {
      logger.debug("[chat] score response details", {
        sessionId: body.sessionId,
        scoreRaw: response.score.raw,
        scoreAdjusted: response.score.adjusted,
        emotion: response.emotion,
      });

      const idempotencyKey = `chat:${userId}:${body.sessionId}:${body.clientMessageId}`;
      const persistMessagePromise = messageService
        .saveUserAndAiMessages({
          userId,
          sessionId: body.sessionId,
          userMessage: body.message,
          aiMessage: response.reply,
          aiPoint: response.score.adjusted,
          aiEmotion: response.emotion,
        })
        .catch((error: unknown) => {
          logger.error("[chat] failed to persist chat messages", error);
        });

      let balance: number;
      try {
        const pointsView = await addPointsWithRetry(
          {
            userId,
            amount: response.score.adjusted,
            idempotencyKey,
          },
          POINT_PERSIST_SYNC_RETRY_COUNT,
        );
        balance = pointsView.balance;
      } catch (error) {
        logger.error("[chat] failed to persist points after retries", error);

        after(
          addPointsWithRetry(
            {
              userId,
              amount: response.score.adjusted,
              idempotencyKey,
            },
            POINT_PERSIST_BACKGROUND_RETRY_COUNT,
          ).catch((retryError: unknown) => {
            logger.error("[chat] failed to persist points in background retry", retryError);
          }),
        );

        const snapshot = await pointService.getMyPoints(userId);
        balance = snapshot.balance;
      }

      await persistMessagePromise;

      logger.info("[chat] message persisted and points reflected", {
        sessionId: body.sessionId,
        balance,
      });
      return NextResponse.json(chatSuccessResponseSchema.parse({ ...response, balance }));
    }

    logger.info("[chat] game over response", {
      sessionId: body.sessionId,
      hitWord: response.hitWord,
    });
    await messageService
      .saveUserAndAiMessages({
        userId,
        sessionId: body.sessionId,
        userMessage: body.message,
        aiMessage: response.reply,
        aiPoint: null,
        aiEmotion: null,
      })
      .catch((error: unknown) => {
        logger.error("[chat] failed to persist game-over messages", error);
      });

    return NextResponse.json(chatSuccessResponseSchema.parse(response));
  } catch (error) {
    const { status, body } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}
