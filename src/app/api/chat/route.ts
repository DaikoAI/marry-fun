import { handleSendMessage, handleStartGame } from "@/interfaces/api/chat-handler";
import { persistChatMessageResponse, persistGameOverResponse } from "@/interfaces/api/chat-persistence";
import { handleApiError } from "@/interfaces/errors/api-error-handler";
import type { ErrorResponse } from "@/interfaces/schemas/chat";
import { chatRequestSchema, chatSuccessResponseSchema } from "@/interfaces/schemas/chat";
import { getServerSession } from "@/lib/auth/server-session";
import { logger } from "@/utils/logger";
import { after, NextResponse } from "next/server";

function maskUserId(userId: string): string {
  if (userId.length <= 10) return userId;
  return `${userId.slice(0, 6)}...${userId.slice(-4)}`;
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

      const balance = await persistChatMessageResponse({
        userId,
        sessionId: body.sessionId,
        userMessage: body.message,
        clientMessageId: body.clientMessageId,
        response,
        scheduleInBackground: task => {
          after(task);
        },
      });

      return NextResponse.json(chatSuccessResponseSchema.parse({ ...response, balance }));
    }

    logger.info("[chat] game over response", {
      sessionId: body.sessionId,
      hitWord: response.hitWord,
    });
    await persistGameOverResponse({
      userId,
      sessionId: body.sessionId,
      userMessage: body.message,
      response,
    });

    return NextResponse.json(chatSuccessResponseSchema.parse(response));
  } catch (error) {
    const { status, body } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}
