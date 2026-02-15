import { GameSession } from "@/domain/entities/game-session";
import type { GameSessionRepository } from "@/domain/repositories/game-session-repository";
import type { NgWordCachePort } from "@/domain/repositories/ng-word-cache-port";
import { NgWord } from "@/domain/values/ng-word";
import type { AiChatAdapter } from "@/domain/adapter/ai-chat";

export function createMockRepo(): GameSessionRepository {
  const store = new Map<string, GameSession>();
  /* eslint-disable @typescript-eslint/require-await */
  return {
    save: async (session: GameSession) => {
      store.set(session.id, session);
    },
    findById: async (id: string) => store.get(id),
    findTodayByUserId: async (_userId: string) => {
      return [...store.values()];
    },
    updateStatus: async (id: string, status: string, messageCount: number) => {
      const session = store.get(id);
      if (session) {
        session.status = status as "active" | "completed" | "game_over";
        session.messageCount = messageCount;
      }
    },
    delete: async (id: string) => {
      store.delete(id);
    },
  };
  /* eslint-enable @typescript-eslint/require-await */
}

export function createMockNgWordCache(): NgWordCachePort {
  const store = new Map<string, NgWord[]>();
  return {
    set: (sessionId: string, ngWords: NgWord[]) => {
      store.set(sessionId, ngWords);
    },
    get: (sessionId: string) => store.get(sessionId),
    delete: (sessionId: string) => {
      store.delete(sessionId);
    },
  };
}

export function createMockAi(overrides: Partial<AiChatAdapter> = {}): AiChatAdapter {
  /* eslint-disable @typescript-eslint/require-await */
  return {
    generateNgWords: async () => ["嫌い", "つまらない", "boring"],
    sendMessage: async () => ({ message: "こんにちは！", score: 5, emotion: "joy" as const }),
    getShockResponse: async () => "なんでそんなこと言うの...！信じられない...！",
    ...overrides,
  };
  /* eslint-enable @typescript-eslint/require-await */
}

export function createTestSession(id = "test-session-1"): GameSession {
  return new GameSession(id, "test-user-id", "テストユーザー", "tsundere", [new NgWord("嫌い"), new NgWord("boring")]);
}
