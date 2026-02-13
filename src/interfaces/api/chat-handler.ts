import type { Emotion } from "@/domain/values/emotion";
import { isEmotion } from "@/domain/values/emotion";
import type { Locale } from "@/domain/values/locale";
import { gameSessionUseCase } from "@/infrastructure/container";
import type { GameOverResponse, MessageResponse, StartResponse } from "../schemas/chat";

export interface StartGameHandlerResult {
  response: StartResponse;
  backgroundTask?: Promise<void>;
}

type MessageResponseWithoutBalance = Omit<MessageResponse, "balance">;
type SendMessageHandlerResponse = MessageResponseWithoutBalance | GameOverResponse;

export async function handleStartGame(username: string, locale: Locale): Promise<StartGameHandlerResult> {
  const result = await gameSessionUseCase.startGame(username, locale);
  return {
    response: {
      type: "start",
      sessionId: result.sessionId,
      characterType: result.characterType,
      greeting: result.greeting,
    },
    backgroundTask: result.backgroundTask,
  };
}

export async function handleSendMessage(
  sessionId: string,
  message: string,
  locale: Locale,
): Promise<SendMessageHandlerResponse> {
  const result = await gameSessionUseCase.chat(sessionId, message, locale);

  if (result.isGameOver && result.hitWord) {
    return {
      type: "game_over",
      reply: result.reply,
      hitWord: result.hitWord,
    };
  }

  if (!result.score) {
    throw new Error("Score is required for non-game-over response");
  }

  if (!result.emotion) {
    throw new Error("Emotion is required for message response");
  }
  const emotion: Emotion = isEmotion(result.emotion) ? result.emotion : "default";
  return {
    type: "message",
    reply: result.reply,
    score: {
      raw: result.score.raw,
      adjusted: result.score.adjusted,
    },
    emotion,
  };
}
