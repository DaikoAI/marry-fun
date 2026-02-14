import { DomainError } from "./domain-error";

export class GameOverBlockedError extends DomainError {
  readonly code = "GAME_OVER_BLOCKED";
  readonly statusCode = 403;

  constructor(userId: string) {
    super(`User ${userId} has a game-over session today and cannot start a new game`);
  }
}
