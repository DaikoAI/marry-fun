import type { GirlResponse } from "@/domain/values/girl-response";
import { gameOverResponseSchema, messageResponseSchema, startResponseSchema } from "@/interfaces/schemas/chat";

// --- Init Game Session ---

export interface InitGameResult {
  sessionId: string;
  characterType: string;
  greeting: GirlResponse;
}

export async function initGameSession(username: string, locale: string): Promise<InitGameResult> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ isInit: true, username, locale }),
  });

  if (!res.ok) throw new Error("Failed to initialize game session");

  const json: unknown = await res.json();
  const parsed = startResponseSchema.parse(json);
  return {
    sessionId: parsed.sessionId,
    characterType: parsed.characterType,
    greeting: {
      content: parsed.greeting,
      points: 0,
      emotion: "joy",
    },
  };
}

// --- Fetch Girl Response ---

export interface ExtendedGirlResponse extends GirlResponse {
  isGameOver?: boolean;
  hitWord?: string;
}

export async function fetchGirlResponse(
  sessionId: string,
  userMessage: string,
  locale: string,
  signal?: AbortSignal,
): Promise<ExtendedGirlResponse> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ isInit: false, sessionId, message: userMessage, locale }),
    signal,
  });

  if (!res.ok) throw new Error("Failed to send message");

  const json: unknown = await res.json();

  const gameOver = gameOverResponseSchema.safeParse(json);
  if (gameOver.success) {
    return {
      content: gameOver.data.reply,
      points: 0,
      emotion: "sad",
      isGameOver: true,
      hitWord: gameOver.data.hitWord,
    };
  }

  const message = messageResponseSchema.parse(json);

  return {
    content: message.reply,
    points: message.score.adjusted,
    emotion: message.emotion,
  };
}
