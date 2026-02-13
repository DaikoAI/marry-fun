import type { GameSession } from "../entities/game-session";

export interface GameSessionRepository {
  save: (session: GameSession) => void;
  findById: (id: string) => GameSession | undefined;
  delete: (id: string) => void;
}
