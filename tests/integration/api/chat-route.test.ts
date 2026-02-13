import { describe, expect, it, vi } from "vitest";
import type { AiChatAdapter } from "@/domain/adapter/ai-chat";
import { GameSessionUseCase } from "@/usecase/chat";
import { GameSessionRepositoryImpl } from "@/infrastructure/repositories/game-session";

interface ApiResponse {
  type: string;
  sessionId?: string;
  characterType?: string;
  greeting?: string;
  reply?: string;
  score?: { raw: number; adjusted: number };
  emotion?: string;
  hitWord?: string;
  code?: string;
}

async function jsonBody(res: Response): Promise<ApiResponse> {
  return res.json();
}

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

describe("POST /api/chat", () => {
  it("init リクエストで sessionId と greeting を返す", async () => {
    const res = await POST(createRequest({ isInit: true, username: "テスト" }));
    const json = await jsonBody(res);

    expect(res.status).toBe(200);
    expect(json.type).toBe("start");
    expect(json.sessionId).toBeDefined();
    expect(json.characterType).toBeDefined();
    expect(json.greeting).toBe("Hello! Nice to meet you!");
  });

  it("message リクエストで reply と score を返す", async () => {
    const initRes = await POST(createRequest({ isInit: true, username: "テスト", locale: "ja" }));
    const initJson = await jsonBody(initRes);
    expect(initRes.status).toBe(200);
    expect(initJson.sessionId).toBeDefined();

    const res = await POST(
      createRequest({
        isInit: false,
        sessionId: initJson.sessionId,
        message: "Nice weather today",
      }),
    );
    const json = await jsonBody(res);

    expect(res.status).toBe(200);
    expect(json.type).toBe("message");
    expect(json.reply).toBe("Hello! Nice to meet you!");
    expect(json.score?.raw).toBe(5);
    expect(json.score?.adjusted).toBe(6);
    expect(json.emotion).toBe("joy");
  });

  it("emotion は常にレスポンスに含まれる（型安全）", async () => {
    const { gameSessionUseCase } = await import("@/infrastructure/container");
    const ai = (gameSessionUseCase as unknown as { ai: { sendMessage: ReturnType<typeof vi.fn> } }).ai;
    ai.sendMessage
      .mockResolvedValueOnce({ message: "Hi!", score: 5, emotion: "joy" })
      .mockResolvedValueOnce({ message: "Hey there!", score: 7, emotion: "default" });

    const initRes = await POST(createRequest({ isInit: true, username: "テスト" }));
    const initJson = await jsonBody(initRes);

    const res = await POST(
      createRequest({
        isInit: false,
        sessionId: initJson.sessionId,
        message: "Tell me something",
      }),
    );
    const json = await jsonBody(res);

    expect(res.status).toBe(200);
    expect(json.type).toBe("message");
    expect(json.reply).toBe("Hey there!");
    expect(json.emotion).toBe("default");
  });

  it("不正な emotion はアダプターで default にフォールバックされる", async () => {
    const { gameSessionUseCase } = await import("@/infrastructure/container");
    const ai = (gameSessionUseCase as unknown as { ai: { sendMessage: ReturnType<typeof vi.fn> } }).ai;
    ai.sendMessage
      .mockResolvedValueOnce({ message: "Hi!", score: 5, emotion: "joy" })
      .mockResolvedValueOnce({ message: "Hmm...", score: 6, emotion: "invalid-emotion" as never });

    const initRes = await POST(createRequest({ isInit: true, username: "テスト" }));
    const initJson = await jsonBody(initRes);

    const res = await POST(
      createRequest({
        isInit: false,
        sessionId: initJson.sessionId,
        message: "hello",
        locale: "en",
      }),
    );
    const json = await jsonBody(res);

    expect(res.status).toBe(200);
    expect(json.type).toBe("message");
    // Adapter normalizes invalid emotion to "default"
    expect(json.emotion).toBe("default");
  });

  it("NGワード送信でゲームオーバーを返す", async () => {
    const initRes = await POST(createRequest({ isInit: true, username: "テスト" }));
    const initJson = await jsonBody(initRes);

    const res = await POST(
      createRequest({
        isInit: false,
        sessionId: initJson.sessionId,
        message: "あなたが嫌いです",
      }),
    );
    const json = await jsonBody(res);

    expect(res.status).toBe(200);
    expect(json.type).toBe("game_over");
    expect(json.reply).toBe("Why would you say that...! I can't believe it...!");
    expect(json.hitWord).toBe("嫌い");
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
      }),
    );
    const json = await jsonBody(res);

    expect(res.status).toBe(404);
    expect(json.type).toBe("error");
    expect(json.code).toBe("SESSION_NOT_FOUND");
  });

  it("username が空文字で 400 を返す", async () => {
    const res = await POST(createRequest({ isInit: true, username: "" }));
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
        }),
      );
      const json = await jsonBody(res);

      expect(res.status).toBe(200);
      expect(json.type).toBe("message");
      expect(json.score).toBeDefined();
    });

    it("不正な locale で 400 を返す", async () => {
      const res = await POST(createRequest({ isInit: true, username: "test", locale: "fr" }));
      const json = await jsonBody(res);

      expect(res.status).toBe(400);
      expect(json.type).toBe("error");
      expect(json.code).toBe("VALIDATION_ERROR");
    });
  });
});
