import { beforeEach, describe, expect, it, vi } from "vitest";
import { ChatLimitExceededError } from "@/domain/errors/chat-limit-exceeded-error";
import { GameOverBlockedError } from "@/domain/errors/game-over-blocked-error";
import { SessionNotFoundError } from "@/domain/errors/session-not-found-error";
import { logger } from "@/utils/logger";
import { GameSessionUseCase } from "@/usecase/chat";
import { createMockAi, createMockNgWordCache, createMockRepo } from "../../helpers/fixtures";
import type { GameSessionRepository } from "@/domain/repositories/game-session-repository";
import type { AiChatAdapter } from "@/domain/adapter/ai-chat";
import type { NgWordCachePort } from "@/domain/repositories/ng-word-cache-port";

describe("GameSessionUseCase", () => {
  let repo: GameSessionRepository;
  let ai: AiChatAdapter;
  let cache: NgWordCachePort;
  let usecase: GameSessionUseCase;

  beforeEach(() => {
    vi.restoreAllMocks();
    repo = createMockRepo();
    ai = createMockAi();
    cache = createMockNgWordCache();
    usecase = new GameSessionUseCase(repo, ai, cache);
  });

  describe("startGame", () => {
    it("新規セッションを作成しremainingChats=20を返す", async () => {
      const result = await usecase.startGame("user-1", "テスト", "ja");
      await result.backgroundTask;

      expect(result.sessionId).toBeDefined();
      expect(result.characterType).toBeDefined();
      expect(result.greeting).toBe("こんにちは！");
      expect(result.remainingChats).toBe(20);
    });

    it("NG wordがバックグラウンドでキャッシュに保存される", async () => {
      const result = await usecase.startGame("user-1", "テスト", "ja");
      await result.backgroundTask;

      const cached = cache.get(result.sessionId);
      expect(cached).toBeDefined();
      expect(cached).toHaveLength(3);
    });

    it("NGワード生成時にINFO/DEBUGログを出力する", async () => {
      const infoSpy = vi.spyOn(logger, "info").mockImplementation(() => undefined);
      const debugSpy = vi.spyOn(logger, "debug").mockImplementation(() => undefined);

      const result = await usecase.startGame("user-1", "テスト", "ja");
      await result.backgroundTask;

      expect(infoSpy).toHaveBeenCalledWith(
        "[ng-word] generated",
        expect.objectContaining({ sessionId: result.sessionId, source: "start", count: 3 }),
      );
      expect(debugSpy).toHaveBeenCalledWith(
        "[ng-word] generated words",
        expect.objectContaining({
          sessionId: result.sessionId,
          source: "start",
          words: ["嫌い", "つまらない", "boring"],
        }),
      );
    });

    it("activeセッションがあればresumeしgreetingは空", async () => {
      const first = await usecase.startGame("user-1", "テスト", "ja");
      await first.backgroundTask;

      const second = await usecase.startGame("user-1", "テスト", "ja");
      expect(second.sessionId).toBe(first.sessionId);
      expect(second.greeting).toBe("");
      expect(second.remainingChats).toBe(20);
    });

    it("resume時にNGワードキャッシュが空なら再生成する", async () => {
      const generateSpy = vi.spyOn(ai, "generateNgWords");

      const first = await usecase.startGame("user-1", "テスト", "ja");
      await first.backgroundTask;
      expect(generateSpy).toHaveBeenCalledTimes(1);

      // キャッシュを消してresume
      cache.delete(first.sessionId);
      const second = await usecase.startGame("user-1", "テスト", "ja");
      await second.backgroundTask;

      expect(generateSpy).toHaveBeenCalledTimes(2);
      expect(cache.get(first.sessionId)).toBeDefined();
    });

    it("game_overセッションがある日は新規開始できない", async () => {
      const result = await usecase.startGame("user-1", "テスト", "ja");
      await result.backgroundTask;

      // NG wordを踏んでgame over
      await usecase.chat(result.sessionId, "嫌い", "ja");

      await expect(usecase.startGame("user-1", "テスト", "ja")).rejects.toThrow(GameOverBlockedError);
    });
  });

  describe("chat", () => {
    it("通常メッセージでreplyとscoreを返しmessageCountが増える", async () => {
      const { sessionId, backgroundTask } = await usecase.startGame("user-1", "テスト", "ja");
      await backgroundTask;

      const result = await usecase.chat(sessionId, "こんにちは", "ja");

      expect(result.isGameOver).toBe(false);
      expect(result.reply).toBe("こんにちは！");
      expect(result.score?.raw).toBe(5);
      expect(result.remainingChats).toBe(19);
    });

    it("存在しないセッションでSessionNotFoundError", async () => {
      await expect(usecase.chat("non-existent", "hello", "ja")).rejects.toThrow(SessionNotFoundError);
    });

    it("NGワードでgame_overになりmessageCountが増える", async () => {
      const { sessionId, backgroundTask } = await usecase.startGame("user-1", "テスト", "ja");
      await backgroundTask;

      // 先に通常メッセージを数回送信
      await usecase.chat(sessionId, "こんにちは", "ja");
      await usecase.chat(sessionId, "元気？", "ja");

      const result = await usecase.chat(sessionId, "嫌い", "ja");

      expect(result.isGameOver).toBe(true);
      expect(result.hitWord).toBe("嫌い");
      expect(result.remainingChats).toBe(0);

      // messageCountが3（通常2 + NGワード1）
      const session = await repo.findById(sessionId);
      expect(session?.messageCount).toBe(3);
      expect(session?.status).toBe("game_over");
    });

    it("NGワード1発目でもmessageCountが1になる", async () => {
      const { sessionId, backgroundTask } = await usecase.startGame("user-1", "テスト", "ja");
      await backgroundTask;

      await usecase.chat(sessionId, "嫌い", "ja");

      const session = await repo.findById(sessionId);
      expect(session?.messageCount).toBe(1);
      expect(session?.status).toBe("game_over");
    });

    it("game_over後にchatするとChatLimitExceededError", async () => {
      const { sessionId, backgroundTask } = await usecase.startGame("user-1", "テスト", "ja");
      await backgroundTask;

      await usecase.chat(sessionId, "嫌い", "ja");

      await expect(usecase.chat(sessionId, "ごめんね", "ja")).rejects.toThrow(ChatLimitExceededError);
    });

    it("20メッセージでcompletedになりremainingChats=0を返す", async () => {
      const { sessionId, backgroundTask } = await usecase.startGame("user-1", "テスト", "ja");
      await backgroundTask;

      let lastResult;
      for (let i = 0; i < 20; i++) {
        lastResult = await usecase.chat(sessionId, `msg${String(i)}`, "ja");
      }

      expect(lastResult?.remainingChats).toBe(0);

      const session = await repo.findById(sessionId);
      expect(session?.status).toBe("completed");
      expect(session?.messageCount).toBe(20);
    });

    it("completed後にchatするとChatLimitExceededError", async () => {
      const { sessionId, backgroundTask } = await usecase.startGame("user-1", "テスト", "ja");
      await backgroundTask;

      for (let i = 0; i < 20; i++) {
        await usecase.chat(sessionId, `msg${String(i)}`, "ja");
      }

      await expect(usecase.chat(sessionId, "もう一回", "ja")).rejects.toThrow(ChatLimitExceededError);
    });

    it("NGワードキャッシュがない場合は再生成してNG判定する", async () => {
      const { sessionId, backgroundTask } = await usecase.startGame("user-1", "テスト", "ja");
      await backgroundTask;

      // キャッシュをクリアしてNGワード「嫌い」を送信
      cache.delete(sessionId);
      const result = await usecase.chat(sessionId, "嫌い", "ja");

      expect(result.isGameOver).toBe(true);
      expect(result.hitWord).toBe("嫌い");
      expect(result.remainingChats).toBe(0);
      expect(cache.get(sessionId)).toBeUndefined();
    });

    it("NGワード再生成に失敗した場合はWARNログを出して継続する", async () => {
      const warnSpy = vi.spyOn(logger, "warn").mockImplementation(() => undefined);
      const { sessionId, backgroundTask } = await usecase.startGame("user-1", "テスト", "ja");
      await backgroundTask;

      cache.delete(sessionId);
      vi.spyOn(ai, "generateNgWords").mockRejectedValueOnce(new Error("regenerate failed"));

      const result = await usecase.chat(sessionId, "嫌い", "ja");

      expect(result.isGameOver).toBe(false);
      expect(result.remainingChats).toBe(19);
      expect(warnSpy).toHaveBeenCalledWith(
        "[chat] NG word cache miss regeneration failed, continuing with current session words:",
        expect.any(Error),
      );
    });
  });
});
