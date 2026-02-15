import { DomainError } from "./domain-error";

export class ChatLimitExceededError extends DomainError {
  readonly code = "CHAT_LIMIT_EXCEEDED";
  readonly statusCode = 403;

  constructor(sessionId: string) {
    super(`Chat limit exceeded for session: ${sessionId}`);
  }
}
