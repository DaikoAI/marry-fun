import type { AiChatAdapter } from "@/domain/adapter/ai-chat";
import { GameSession } from "@/domain/entities/game-session";
import { ChatLimitExceededError } from "@/domain/errors/chat-limit-exceeded-error";
import { GameOverBlockedError } from "@/domain/errors/game-over-blocked-error";
import { SessionNotFoundError } from "@/domain/errors/session-not-found-error";
import type { GameSessionRepository } from "@/domain/repositories/game-session-repository";
import { randomCharacterType } from "@/domain/values/character-type";
import type { CharacterType } from "@/domain/values/character-type";
import type { Emotion } from "@/domain/values/emotion";
import type { Locale } from "@/domain/values/locale";
import { NgWord } from "@/domain/values/ng-word";
import { Score } from "@/domain/values/score";
import type { NgWordCache } from "@/infrastructure/repositories/ng-word-cache";
import { logger } from "@/utils/logger";

export interface StartGameResult {
  sessionId: string;
  characterType: CharacterType;
  greeting: string;
  remainingChats: number;
  backgroundTask?: Promise<void>;
}

export interface ChatResult {
  reply: string;
  score?: Score;
  emotion?: Emotion;
  hitWord?: string;
  isGameOver: boolean;
  remainingChats: number;
}

export class GameSessionUseCase {
  constructor(
    private readonly repo: GameSessionRepository,
    private readonly ai: AiChatAdapter,
    private readonly ngWordCache: NgWordCache,
  ) {}

  async startGame(userId: string, username: string, locale: Locale): Promise<StartGameResult> {
    // Check today's sessions for game_over block or active resume
    const todaySessions = await this.repo.findTodayByUserId(userId);

    const gameOverSession = todaySessions.find(s => s.status === "game_over");
    if (gameOverSession) {
      throw new GameOverBlockedError(userId);
    }

    const activeSession = todaySessions.find(s => s.status === "active");
    if (activeSession) {
      // Resume existing active session — no greeting, just return remaining chats
      // Re-generate NG words if cache was cleared
      let backgroundTask: Promise<void> | undefined;
      if (!this.ngWordCache.get(activeSession.id)) {
        backgroundTask = this.ai
          .generateNgWords(activeSession.id, activeSession.characterType, locale)
          .then(rawNgWords => {
            const ngWords = rawNgWords.map(w => new NgWord(w));
            this.ngWordCache.set(activeSession.id, ngWords);
          })
          .catch((err: unknown) => {
            logger.warn("[startGame:resume] NG word regeneration failed:", err);
          });
      }
      return {
        sessionId: activeSession.id,
        characterType: activeSession.characterType,
        greeting: "",
        remainingChats: activeSession.remainingChats,
        backgroundTask,
      };
    }

    // New session
    const sessionId = crypto.randomUUID();
    const characterType = randomCharacterType();

    const { message: greeting } = await this.ai.sendMessage(sessionId, characterType, username, "__INIT__", locale);

    const session = new GameSession(sessionId, userId, username, characterType);
    await this.repo.save(session);

    // Fire NG word generation without awaiting
    const bgTask = this.ai
      .generateNgWords(sessionId, characterType, locale)
      .then(rawNgWords => {
        const ngWords = rawNgWords.map(w => new NgWord(w));
        this.ngWordCache.set(sessionId, ngWords);
      })
      .catch((err: unknown) => {
        logger.warn("[startGame] NG word generation failed, continuing without NG words:", err);
      });

    return { sessionId, characterType, greeting, remainingChats: session.remainingChats, backgroundTask: bgTask };
  }

  async chat(sessionId: string, message: string, locale: Locale): Promise<ChatResult> {
    const session = await this.repo.findById(sessionId);
    if (!session) {
      throw new SessionNotFoundError(sessionId);
    }

    if (!session.canChat) {
      throw new ChatLimitExceededError(sessionId);
    }

    // Load NG words from cache
    const cachedNgWords = this.ngWordCache.get(sessionId);
    if (cachedNgWords) {
      session.ngWords = cachedNgWords;
    }

    // Check NG words
    const hitNgWord = session.checkNgWord(message);
    if (hitNgWord) {
      const angryReply = await this.ai.getShockResponse(
        sessionId,
        session.characterType,
        session.username,
        hitNgWord.word,
        locale,
      );
      session.markGameOver();
      await this.repo.updateStatus(sessionId, session.status, session.messageCount);
      this.ngWordCache.delete(sessionId);
      return { reply: angryReply, hitWord: hitNgWord.word, isGameOver: true, remainingChats: 0 };
    }

    const {
      message: reply,
      score: rawScore,
      emotion,
    } = await this.ai.sendMessage(sessionId, session.characterType, session.username, message, locale);
    const score = Score.fromRaw(rawScore);
    session.incrementMessageCount();
    await this.repo.updateStatus(sessionId, session.status, session.messageCount);

    if (session.status === "completed") {
      this.ngWordCache.delete(sessionId);
    }

    return { reply, score, emotion, isGameOver: false, remainingChats: session.remainingChats };
  }
}
