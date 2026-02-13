import type { GameSession } from "@/domain/entities/game-session";
import type { GameSessionRepository } from "@/domain/repositories/game-session-repository";

const STORE_KEY = Symbol.for("marry-fun.game-sessions");

function getStore(): Map<string, GameSession> {
  const g = globalThis as Record<symbol, Map<string, GameSession> | undefined>;
  if (!g[STORE_KEY]) {
    g[STORE_KEY] = new Map();
  }
  return g[STORE_KEY];
}

export class GameSessionRepositoryImpl implements GameSessionRepository {
  save(session: GameSession): void {
    getStore().set(session.id, session);
  }

  findById(id: string): GameSession | undefined {
    return getStore().get(id);
  }

  delete(id: string): void {
    getStore().delete(id);
  }
}
