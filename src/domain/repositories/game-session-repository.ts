import type { GameSession } from "../entities/game-session";

export interface GameSessionRepository {
  save: (session: GameSession) => Promise<void>;
  findById: (id: string) => Promise<GameSession | undefined>;
  findTodayByUserId: (userId: string) => Promise<GameSession[]>;
  updateStatus: (id: string, status: string, messageCount: number) => Promise<void>;
  delete: (id: string) => Promise<void>;
}
