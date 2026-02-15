import type { GirlResponse } from "@/domain/values/girl-response";
import { gameOverResponseSchema, messageResponseSchema, startResponseSchema } from "@/interfaces/schemas/chat";

// --- Init Game Session ---

export interface InitGameResult {
  sessionId: string;
  characterType: string;
  greeting: GirlResponse;
  remainingChats: number;
}

const INIT_SESSION_TIMEOUT_MS = 60_000;

export async function initGameSession(username: string, locale: string): Promise<InitGameResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, INIT_SESSION_TIMEOUT_MS);

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isInit: true, username, locale }),
      signal: controller.signal,
    });
    return await parseInitResponse(res);
  } finally {
    clearTimeout(timeoutId);
  }
}

async function parseInitResponse(res: Response): Promise<InitGameResult> {
  if (!res.ok) {
    const json: unknown = await res.json().catch(() => null);
    const error = json as { code?: string } | null;
    const err = new Error("Failed to initialize game session");
    if (error?.code) {
      (err as Error & { code?: string }).code = error.code;
    }
    throw err;
  }

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
    remainingChats: parsed.remainingChats,
  };
}

// --- Fetch Girl Response ---

export interface ExtendedGirlResponse extends GirlResponse {
  balance?: number;
  isGameOver?: boolean;
  hitWord?: string;
  remainingChats: number;
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
    body: JSON.stringify({
      isInit: false,
      sessionId,
      message: userMessage,
      locale,
      clientMessageId: crypto.randomUUID(),
    }),
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
      remainingChats: 0,
    };
  }

  const message = messageResponseSchema.parse(json);

  return {
    content: message.reply,
    points: message.score.adjusted,
    balance: message.balance,
    emotion: message.emotion,
    remainingChats: message.remainingChats,
  };
}
