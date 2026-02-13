import type { MessageRepository, SaveMessageInput } from "@/domain/repositories/message-repository";
import { getDb } from "@/infrastructure/db/client";
import { messages } from "@/infrastructure/db/schema";

export class D1MessageRepository implements MessageRepository {
  async saveMany(inputs: SaveMessageInput[]): Promise<void> {
    if (inputs.length === 0) {
      return;
    }

    const db = await getDb();
    await db.insert(messages).values(
      inputs.map(input => ({
        id: crypto.randomUUID(),
        userId: input.userId,
        sessionId: input.sessionId,
        role: input.role,
        content: input.content,
        point: input.point,
        emotion: input.emotion,
        createdAt: input.createdAt,
      })),
    );
  }
}
