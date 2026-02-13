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

async function addPointsWithRetry(
  input: { userId: string; amount: number; idempotencyKey: string },
  retryCount: number,
) {
  let lastError: unknown;

  for (let attempt = 1; attempt <= retryCount; attempt++) {
    try {
      return await pointService.addMyPoints({
        userId: input.userId,
        amount: input.amount,
        reason: "chat",
        idempotencyKey: input.idempotencyKey,
      });
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

    if (body.isInit) {
      const { response, backgroundTask } = await handleStartGame(body.username, body.locale);
      if (backgroundTask) {
        after(backgroundTask);
      }
      return NextResponse.json(chatSuccessResponseSchema.parse(response));
    }

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

    const response = await handleSendMessage(body.sessionId, body.message, body.locale);
    if (response.type === "message") {
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

      return NextResponse.json(chatSuccessResponseSchema.parse({ ...response, balance }));
    }

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
