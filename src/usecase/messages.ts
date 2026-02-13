import type { Emotion } from "@/domain/values/emotion";
import type { MessageRepository } from "@/domain/repositories/message-repository";

export interface SaveUserAndAiMessagesInput {
  userId: string;
  sessionId: string;
  userMessage: string;
  aiMessage: string;
  aiPoint: number | null;
  aiEmotion: Emotion | null;
}

export class MessageService {
  constructor(private readonly messageRepository: MessageRepository) {}

  async saveUserAndAiMessages(input: SaveUserAndAiMessagesInput): Promise<void> {
    const createdAt = new Date();

    await this.messageRepository.saveMany([
      {
        userId: input.userId,
        sessionId: input.sessionId,
        role: "user",
        content: input.userMessage,
        point: null,
        emotion: null,
        createdAt,
      },
      {
        userId: input.userId,
        sessionId: input.sessionId,
        role: "ai",
        content: input.aiMessage,
        point: input.aiPoint,
        emotion: input.aiEmotion,
        createdAt,
      },
    ]);
  }
}
