import { beforeEach, describe, expect, it, vi } from "vitest";

const mockAddMyPoints = vi.fn();
const mockGetMyPoints = vi.fn();
const mockSaveUserAndAiMessages = vi.fn();

vi.mock("@/infrastructure/points-container", () => ({
  pointService: {
    addMyPoints: mockAddMyPoints,
    getMyPoints: mockGetMyPoints,
  },
}));

vi.mock("@/infrastructure/messages-container", () => ({
  messageService: {
    saveUserAndAiMessages: mockSaveUserAndAiMessages,
  },
}));

const { persistChatMessageResponse, persistGameOverResponse } = await import("@/interfaces/api/chat-persistence");

describe("chat-persistence", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAddMyPoints.mockResolvedValue({
      userId: "u1",
      walletAddress: null,
      balance: 9,
      transactions: [],
    });
    mockGetMyPoints.mockResolvedValue({
      userId: "u1",
      walletAddress: null,
      balance: 42,
      transactions: [],
    });
    mockSaveUserAndAiMessages.mockResolvedValue(undefined);
  });

  it("通常メッセージの永続化で balance を返す", async () => {
    const balance = await persistChatMessageResponse({
      userId: "u1",
      sessionId: "session-1",
      userMessage: "hello",
      clientMessageId: "client-1",
      response: {
        type: "message",
        reply: "hi",
        score: { raw: 5, adjusted: 9 },
        emotion: "joy",
        remainingChats: 19,
      },
      scheduleInBackground: () => {},
    });

    expect(balance).toBe(9);
    expect(mockSaveUserAndAiMessages).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "u1",
        sessionId: "session-1",
        userMessage: "hello",
        aiMessage: "hi",
        aiPoint: 9,
        aiEmotion: "joy",
      }),
    );
    expect(mockAddMyPoints).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "u1",
        amount: 9,
        reason: "chat",
        idempotencyKey: "chat:u1:session-1:client-1",
      }),
    );
    expect(mockGetMyPoints).not.toHaveBeenCalled();
  });

  it("ポイント保存失敗時はスナップショット残高にフォールバックし背景再試行を登録する", async () => {
    mockAddMyPoints.mockRejectedValue(new Error("write failed"));
    const scheduledTasks: Array<() => Promise<void>> = [];

    const balance = await persistChatMessageResponse({
      userId: "u1",
      sessionId: "session-1",
      userMessage: "hello",
      clientMessageId: "client-2",
      response: {
        type: "message",
        reply: "hi",
        score: { raw: 5, adjusted: 9 },
        emotion: "joy",
        remainingChats: 19,
      },
      scheduleInBackground: task => {
        scheduledTasks.push(task);
      },
    });

    expect(balance).toBe(42);
    expect(mockGetMyPoints).toHaveBeenCalledWith("u1");
    expect(scheduledTasks).toHaveLength(1);
  });

  it("ゲームオーバー時は point / emotion なしで保存する", async () => {
    await persistGameOverResponse({
      userId: "u1",
      sessionId: "session-1",
      userMessage: "嫌い",
      response: {
        type: "game_over",
        reply: "やだ",
        hitWord: "嫌い",
        remainingChats: 0,
      },
    });

    expect(mockSaveUserAndAiMessages).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "u1",
        sessionId: "session-1",
        userMessage: "嫌い",
        aiMessage: "やだ",
        aiPoint: null,
        aiEmotion: null,
      }),
    );
  });
});
