import { GameSession } from "@/domain/entities/game-session";
import type { GameSessionRepository } from "@/domain/repositories/game-session-repository";
import { NgWord } from "@/domain/values/ng-word";
import type { AiChatAdapter } from "@/domain/adapter/ai-chat";

export function createMockRepo(): GameSessionRepository {
  const store = new Map<string, GameSession>();
  return {
    save: (session: GameSession) => store.set(session.id, session),
    findById: (id: string) => store.get(id),
    delete: (id: string) => {
      store.delete(id);
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
  return new GameSession(id, "テストユーザー", "tsundere", [new NgWord("嫌い"), new NgWord("boring")]);
}
