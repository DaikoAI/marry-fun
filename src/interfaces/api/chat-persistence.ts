import type { GameOverResponse, MessageResponse } from "@/interfaces/schemas/chat";
import { messageService } from "@/infrastructure/messages-container";
import { pointService } from "@/infrastructure/points-container";
import { logger } from "@/utils/logger";

const POINT_PERSIST_SYNC_RETRY_COUNT = 1;
const POINT_PERSIST_BACKGROUND_RETRY_COUNT = 3;

type MessageResponseWithoutBalance = Omit<MessageResponse, "balance">;

export type BackgroundTaskScheduler = (task: () => Promise<void>) => void;

interface PersistChatMessageParams {
  userId: string;
  sessionId: string;
  userMessage: string;
  clientMessageId: string;
  response: MessageResponseWithoutBalance;
  scheduleInBackground: BackgroundTaskScheduler;
}

interface PersistGameOverMessageParams {
  userId: string;
  sessionId: string;
  userMessage: string;
  response: GameOverResponse;
}

export async function persistChatMessageResponse(params: PersistChatMessageParams): Promise<number> {
  const persistMessagePromise = messageService
    .saveUserAndAiMessages({
      userId: params.userId,
      sessionId: params.sessionId,
      userMessage: params.userMessage,
      aiMessage: params.response.reply,
      aiPoint: params.response.score.adjusted,
      aiEmotion: params.response.emotion,
    })
    .catch((error: unknown) => {
      logger.error("[chat] failed to persist chat messages", error);
    });

  const idempotencyKey = `chat:${params.userId}:${params.sessionId}:${params.clientMessageId}`;

  let balance: number;
  try {
    const pointsView = await addPointsWithRetry(
      {
        userId: params.userId,
        amount: params.response.score.adjusted,
        idempotencyKey,
      },
      POINT_PERSIST_SYNC_RETRY_COUNT,
    );
    balance = pointsView.balance;
  } catch (error) {
    logger.error("[chat] failed to persist points after retries", error);

    params.scheduleInBackground(async () =>
      addPointsWithRetry(
        {
          userId: params.userId,
          amount: params.response.score.adjusted,
          idempotencyKey,
        },
        POINT_PERSIST_BACKGROUND_RETRY_COUNT,
      )
        .then(() => undefined)
        .catch((retryError: unknown) => {
          logger.error("[chat] failed to persist points in background retry", retryError);
        }),
    );

    const snapshot = await pointService.getMyPoints(params.userId);
    balance = snapshot.balance;
  }

  await persistMessagePromise;

  logger.info("[chat] message persisted and points reflected", {
    sessionId: params.sessionId,
    balance,
  });

  return balance;
}

export async function persistGameOverResponse(params: PersistGameOverMessageParams): Promise<void> {
  await messageService
    .saveUserAndAiMessages({
      userId: params.userId,
      sessionId: params.sessionId,
      userMessage: params.userMessage,
      aiMessage: params.response.reply,
      aiPoint: null,
      aiEmotion: null,
    })
    .catch((error: unknown) => {
      logger.error("[chat] failed to persist game-over messages", error);
    });
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
