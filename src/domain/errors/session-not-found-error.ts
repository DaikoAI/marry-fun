import { DomainError } from "./domain-error";

export class SessionNotFoundError extends DomainError {
  readonly code = "SESSION_NOT_FOUND";
  readonly statusCode = 404;

  constructor(sessionId: string) {
    super(`Session not found: ${sessionId}`);
  }
}
