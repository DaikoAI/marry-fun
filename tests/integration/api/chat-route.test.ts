import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AiChatAdapter } from "@/domain/adapter/ai-chat";
import { GameSessionUseCase } from "@/usecase/chat";
import { GameSessionRepositoryImpl } from "@/infrastructure/repositories/game-session";

interface ApiResponse {
  type?: string;
  sessionId?: string;
  characterType?: string;
  greeting?: string;
  reply?: string;
  score?: { raw: number; adjusted: number };
  balance?: number;
  emotion?: string;
  hitWord?: string;
  code?: string;
  message?: string;
}

async function jsonBody(res: Response): Promise<ApiResponse> {
  return (await res.json()) as ApiResponse;
}

const mockGetServerSession = vi.fn<() => Promise<{ user: { id: string } } | null>>(async () => {
  const session = await Promise.resolve({
    user: { id: "u1" },
  });
  return session;
});
const mockAddMyPoints = vi.fn(async () => {
  const points = await Promise.resolve({
    userId: "u1",
    walletAddress: null,
    balance: 9,
    transactions: [],
  });
  return points;
});
const mockGetMyPoints = vi.fn(async () => {
  const snapshot = await Promise.resolve({
    userId: "u1",
    walletAddress: null,
    balance: 100,
    transactions: [],
  });
  return snapshot;
});
const mockSaveUserAndAiMessages = vi.fn(async () => {});

// Mock next/server after() to execute the callback immediately
vi.mock("next/server", async importOriginal => {
  const actual = await importOriginal<typeof import("next/server")>();
  return {
    ...actual,
    after: (taskOrCb: Promise<unknown> | (() => void)) => {
      if (typeof taskOrCb === "function") taskOrCb();
      // For promises, just let them resolve naturally
    },
  };
});

vi.mock("@/lib/auth/server-session", () => ({
  getServerSession: mockGetServerSession,
}));

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

// Mock the container module to inject test dependencies
vi.mock("@/infrastructure/container", () => {
  const repo = new GameSessionRepositoryImpl();
  const mockAi: AiChatAdapter = {
    generateNgWords: vi.fn().mockResolvedValue(["嫌い", "つまらない", "boring"]),
    sendMessage: vi.fn().mockResolvedValue({ message: "Hello! Nice to meet you!", score: 5, emotion: "joy" }),
    getShockResponse: vi.fn().mockResolvedValue("Why would you say that...! I can't believe it...!"),
  };
  return {
    gameSessionUseCase: new GameSessionUseCase(repo, mockAi),
  };
});

// Dynamic import so the mock is applied before module evaluation
const { POST } = await import("@/app/api/chat/route");

function createRequest(body: unknown): Request {
  return new Request("http://localhost:8787/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function createClientMessageId(seed: number): string {
  return `00000000-0000-4000-8000-${String(seed).padStart(12, "0")}`;
}

describe("POST /api/chat", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetServerSession.mockResolvedValue({ user: { id: "u1" } });
    mockAddMyPoints.mockResolvedValue({
      userId: "u1",
      walletAddress: null,
      balance: 9,
      transactions: [],
    });
    mockGetMyPoints.mockResolvedValue({
      userId: "u1",
      walletAddress: null,
      balance: 100,
      transactions: [],
    });
    mockSaveUserAndAiMessages.mockResolvedValue(undefined);
  });

  it("init リクエストで sessionId と greeting を返す", async () => {
    const res = await POST(createRequest({ isInit: true, username: "テスト", locale: "ja" }));
    const json = await jsonBody(res);

    expect(res.status).toBe(200);
    expect(json.type).toBe("start");
    expect(json.sessionId).toBeDefined();
    expect(json.characterType).toBeDefined();
    expect(json.greeting).toBe("Hello! Nice to meet you!");
  });

  it("message リクエストで reply と score を返し point/message を保存する", async () => {
    const initRes = await POST(createRequest({ isInit: true, username: "テスト", locale: "ja" }));
    const initJson = await jsonBody(initRes);
    expect(initRes.status).toBe(200);
    const sessionId = initJson.sessionId;
    expect(sessionId).toBeDefined();
    if (!sessionId) {
      throw new Error("sessionId is missing");
    }

    const res = await POST(
      createRequest({
        isInit: false,
        sessionId,
        message: "Nice weather today",
        locale: "ja",
        clientMessageId: createClientMessageId(1),
      }),
    );
    const json = await jsonBody(res);

    expect(res.status).toBe(200);
    expect(json.type).toBe("message");
    expect(json.reply).toBe("Hello! Nice to meet you!");
    expect(json.score?.raw).toBe(5);
    expect(json.score?.adjusted).toBe(9);
    expect(json.balance).toBe(9);
    expect(json.emotion).toBe("joy");

    expect(mockAddMyPoints).toHaveBeenCalledTimes(1);
    expect(mockAddMyPoints).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "u1",
        amount: 9,
        reason: "chat",
        idempotencyKey: `chat:u1:${sessionId}:${createClientMessageId(1)}`,
      }),
    );

    expect(mockSaveUserAndAiMessages).toHaveBeenCalledTimes(1);
    expect(mockSaveUserAndAiMessages).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "u1",
        sessionId,
        userMessage: "Nice weather today",
        aiMessage: "Hello! Nice to meet you!",
        aiPoint: 9,
        aiEmotion: "joy",
      }),
    );
  });

  it("未ログインの message リクエストで 401 を返す", async () => {
    const initRes = await POST(createRequest({ isInit: true, username: "テスト", locale: "ja" }));
    const initJson = await jsonBody(initRes);
    mockGetServerSession.mockResolvedValueOnce(null);

    const res = await POST(
      createRequest({
        isInit: false,
        sessionId: initJson.sessionId,
        message: "hello",
        locale: "ja",
        clientMessageId: createClientMessageId(2),
      }),
    );

    expect(res.status).toBe(401);
    expect(mockAddMyPoints).not.toHaveBeenCalled();
    expect(mockSaveUserAndAiMessages).not.toHaveBeenCalled();
  });

  it("point 保存失敗でも message レスポンスを返す", async () => {
    const initRes = await POST(createRequest({ isInit: true, username: "テスト", locale: "ja" }));
    const initJson = await jsonBody(initRes);
    mockAddMyPoints.mockRejectedValue(new Error("point write failed"));
    mockGetMyPoints.mockResolvedValueOnce({
      userId: "u1",
      walletAddress: null,
      balance: 42,
      transactions: [],
    });

    const res = await POST(
      createRequest({
        isInit: false,
        sessionId: initJson.sessionId,
        message: "hello",
        locale: "ja",
        clientMessageId: createClientMessageId(3),
      }),
    );
    const json = await jsonBody(res);

    expect(res.status).toBe(200);
    expect(json.type).toBe("message");
    expect(json.balance).toBe(42);
    expect(mockGetMyPoints).toHaveBeenCalledTimes(1);
    expect(mockSaveUserAndAiMessages).toHaveBeenCalledTimes(1);
  });

  it("messages 保存失敗でも message レスポンスを返す", async () => {
    const initRes = await POST(createRequest({ isInit: true, username: "テスト", locale: "ja" }));
    const initJson = await jsonBody(initRes);
    mockSaveUserAndAiMessages.mockRejectedValueOnce(new Error("message write failed"));

    const res = await POST(
      createRequest({
        isInit: false,
        sessionId: initJson.sessionId,
        message: "hello",
        locale: "ja",
        clientMessageId: createClientMessageId(4),
      }),
    );
    const json = await jsonBody(res);

    expect(res.status).toBe(200);
    expect(json.type).toBe("message");
    expect(json.balance).toBe(9);
    expect(mockAddMyPoints).toHaveBeenCalledTimes(1);
  });

  it("emotion は常にレスポンスに含まれる（型安全）", async () => {
    const { gameSessionUseCase } = await import("@/infrastructure/container");
    const ai = (gameSessionUseCase as unknown as { ai: { sendMessage: ReturnType<typeof vi.fn> } }).ai;
    ai.sendMessage
      .mockResolvedValueOnce({ message: "Hi!", score: 5, emotion: "joy" })
      .mockResolvedValueOnce({ message: "Hey there!", score: 7, emotion: "default" });

    const initRes = await POST(createRequest({ isInit: true, username: "テスト", locale: "ja" }));
    const initJson = await jsonBody(initRes);

    const res = await POST(
      createRequest({
        isInit: false,
        sessionId: initJson.sessionId,
        message: "Tell me something",
        locale: "ja",
        clientMessageId: createClientMessageId(5),
      }),
    );
    const json = await jsonBody(res);

    expect(res.status).toBe(200);
    expect(json.type).toBe("message");
    expect(json.reply).toBe("Hey there!");
    expect(json.emotion).toBe("default");
    expect(json.balance).toBe(9);
  });

  it("不正な emotion はアダプターで default にフォールバックされる", async () => {
    const { gameSessionUseCase } = await import("@/infrastructure/container");
    const ai = (gameSessionUseCase as unknown as { ai: { sendMessage: ReturnType<typeof vi.fn> } }).ai;
    ai.sendMessage
      .mockResolvedValueOnce({ message: "Hi!", score: 5, emotion: "joy" })
      .mockResolvedValueOnce({ message: "Hmm...", score: 6, emotion: "invalid-emotion" as never });

    const initRes = await POST(createRequest({ isInit: true, username: "テスト", locale: "ja" }));
    const initJson = await jsonBody(initRes);

    const res = await POST(
      createRequest({
        isInit: false,
        sessionId: initJson.sessionId,
        message: "hello",
        locale: "en",
        clientMessageId: createClientMessageId(6),
      }),
    );
    const json = await jsonBody(res);

    expect(res.status).toBe(200);
    expect(json.type).toBe("message");
    // Adapter normalizes invalid emotion to "default"
    expect(json.emotion).toBe("default");
    expect(json.balance).toBe(9);
  });

  it("NGワード送信でゲームオーバーを返し message を保存する", async () => {
    const initRes = await POST(createRequest({ isInit: true, username: "テスト", locale: "ja" }));
    const initJson = await jsonBody(initRes);

    const res = await POST(
      createRequest({
        isInit: false,
        sessionId: initJson.sessionId,
        message: "あなたが嫌いです",
        locale: "ja",
        clientMessageId: createClientMessageId(7),
      }),
    );
    const json = await jsonBody(res);

    expect(res.status).toBe(200);
    expect(json.type).toBe("game_over");
    expect(json.reply).toBe("Why would you say that...! I can't believe it...!");
    expect(json.hitWord).toBe("嫌い");
    expect(mockAddMyPoints).not.toHaveBeenCalled();
    expect(mockSaveUserAndAiMessages).toHaveBeenCalledTimes(1);
    expect(mockSaveUserAndAiMessages).toHaveBeenCalledWith(
      expect.objectContaining({
        aiMessage: "Why would you say that...! I can't believe it...!",
        aiPoint: null,
        aiEmotion: null,
      }),
    );
  });

  it("不正なbodyで 400 を返す", async () => {
    const res = await POST(createRequest({ invalid: true }));
    const json = await jsonBody(res);

    expect(res.status).toBe(400);
    expect(json.type).toBe("error");
    expect(json.code).toBe("VALIDATION_ERROR");
  });

  it("存在しないセッションIDで 404 を返す", async () => {
    const res = await POST(
      createRequest({
        isInit: false,
        sessionId: "550e8400-e29b-41d4-a716-446655440000",
        message: "hello",
        locale: "ja",
        clientMessageId: createClientMessageId(8),
      }),
    );
    const json = await jsonBody(res);

    expect(res.status).toBe(404);
    expect(json.type).toBe("error");
    expect(json.code).toBe("SESSION_NOT_FOUND");
  });

  it("username が空文字で 400 を返す", async () => {
    const res = await POST(createRequest({ isInit: true, username: "", locale: "ja" }));
    const json = await jsonBody(res);

    expect(res.status).toBe(400);
    expect(json.type).toBe("error");
  });

  it("message が空文字で 400 を返す", async () => {
    const res = await POST(
      createRequest({
        isInit: false,
        sessionId: "550e8400-e29b-41d4-a716-446655440000",
        message: "",
        locale: "ja",
        clientMessageId: createClientMessageId(9),
      }),
    );
    const json = await jsonBody(res);

    expect(res.status).toBe(400);
    expect(json.type).toBe("error");
  });

  describe("locale対応", () => {
    it("locale省略時はデフォルト en で正常動作", async () => {
      const res = await POST(createRequest({ isInit: true, username: "test" }));
      const json = await jsonBody(res);

      expect(res.status).toBe(200);
      expect(json.type).toBe("start");
    });

    it("locale: ja で init リクエストが正常動作", async () => {
      const res = await POST(createRequest({ isInit: true, username: "テスト", locale: "ja" }));
      const json = await jsonBody(res);

      expect(res.status).toBe(200);
      expect(json.type).toBe("start");
      expect(json.sessionId).toBeDefined();
    });

    it("locale: en で init リクエストが正常動作", async () => {
      const res = await POST(createRequest({ isInit: true, username: "test", locale: "en" }));
      const json = await jsonBody(res);

      expect(res.status).toBe(200);
      expect(json.type).toBe("start");
      expect(json.sessionId).toBeDefined();
    });

    it("locale: ja で message リクエストが正常動作", async () => {
      const initRes = await POST(createRequest({ isInit: true, username: "テスト", locale: "ja" }));
      const initJson = await jsonBody(initRes);

      const res = await POST(
        createRequest({
          isInit: false,
          sessionId: initJson.sessionId,
          message: "こんにちは",
          locale: "ja",
          clientMessageId: createClientMessageId(10),
        }),
      );
      const json = await jsonBody(res);

      expect(res.status).toBe(200);
      expect(json.type).toBe("message");
      expect(json.score).toBeDefined();
      expect(json.balance).toBe(9);
    });

    it("不正な locale で 400 を返す", async () => {
      const res = await POST(createRequest({ isInit: true, username: "test", locale: "fr" }));
      const json = await jsonBody(res);

      expect(res.status).toBe(400);
      expect(json.type).toBe("error");
      expect(json.code).toBe("VALIDATION_ERROR");
    });
  });

  it("clientMessageId がない message リクエストで 400 を返す", async () => {
    const initRes = await POST(createRequest({ isInit: true, username: "テスト", locale: "ja" }));
    const initJson = await jsonBody(initRes);

    const res = await POST(
      createRequest({
        isInit: false,
        sessionId: initJson.sessionId,
        message: "hello",
        locale: "ja",
      }),
    );
    const json = await jsonBody(res);

    expect(res.status).toBe(400);
    expect(json.type).toBe("error");
    expect(json.code).toBe("VALIDATION_ERROR");
  });
});
