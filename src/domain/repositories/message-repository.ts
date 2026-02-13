export type MessageRole = "user" | "ai";

export interface SaveMessageInput {
  userId: string;
  sessionId: string;
  role: MessageRole;
  content: string;
  point: number | null;
  emotion: string | null;
  createdAt: Date;
}

export interface MessageRepository {
  saveMany: (inputs: SaveMessageInput[]) => Promise<void>;
}
