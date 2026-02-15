import type { AiChatAdapter } from "@/domain/adapter/ai-chat";
import { GameSession } from "@/domain/entities/game-session";
import { ChatLimitExceededError } from "@/domain/errors/chat-limit-exceeded-error";
import { GameOverBlockedError } from "@/domain/errors/game-over-blocked-error";
import { SessionNotFoundError } from "@/domain/errors/session-not-found-error";
import type { GameSessionRepository } from "@/domain/repositories/game-session-repository";
import type { NgWordCachePort } from "@/domain/repositories/ng-word-cache-port";
import { randomCharacterType } from "@/domain/values/character-type";
import type { CharacterType } from "@/domain/values/character-type";
import type { Emotion } from "@/domain/values/emotion";
import type { Locale } from "@/domain/values/locale";
import { NgWord } from "@/domain/values/ng-word";
import { Score } from "@/domain/values/score";
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
    private readonly ngWordCache: NgWordCachePort,
  ) {}

  private logNgWordsGenerated(params: {
    sessionId: string;
    characterType: CharacterType;
    locale: Locale;
    source: "start" | "resume" | "chat";
    words: string[];
  }): void {
    logger.info("[ng-word] generated", {
      sessionId: params.sessionId,
      characterType: params.characterType,
      locale: params.locale,
      source: params.source,
      count: params.words.length,
    });
    logger.debug("[ng-word] generated words", {
      sessionId: params.sessionId,
      source: params.source,
      words: params.words,
    });
  }

  private async generateAndCacheNgWords(
    sessionId: string,
    characterType: CharacterType,
    locale: Locale,
    source: "start" | "resume" | "chat",
  ): Promise<NgWord[]> {
    const rawNgWords = await this.ai.generateNgWords(sessionId, characterType, locale);
    const ngWords = rawNgWords.map(w => new NgWord(w));
    this.ngWordCache.set(sessionId, ngWords);
    this.logNgWordsGenerated({ sessionId, characterType, locale, source, words: rawNgWords });
    return ngWords;
  }

  async startGame(userId: string, username: string, locale: Locale): Promise<StartGameResult> {
    // Check today's sessions for game_over block or active resume
    const todaySessions = await this.repo.findTodayByUserId(userId);

    const gameOverSession = todaySessions.find(s => s.status === "game_over");
    if (gameOverSession) {
      throw new GameOverBlockedError(userId);
    }

    const activeSession = todaySessions.find(s => s.status === "active");
    if (activeSession) {
      logger.info("[startGame] resumed active session", {
        sessionId: activeSession.id,
        userId,
        characterType: activeSession.characterType,
        remainingChats: activeSession.remainingChats,
      });
      // Resume existing active session — no greeting, just return remaining chats
      // Re-generate NG words if cache was cleared
      let backgroundTask: Promise<void> | undefined;
      if (!this.ngWordCache.get(activeSession.id)) {
        logger.info("[startGame:resume] NG word cache missing, regenerating", {
          sessionId: activeSession.id,
          characterType: activeSession.characterType,
          locale,
        });
        backgroundTask = this.generateAndCacheNgWords(activeSession.id, activeSession.characterType, locale, "resume")
          .then(() => undefined)
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
    logger.info("[startGame] created new session", {
      sessionId,
      userId,
      characterType,
      locale,
    });

    // Fire NG word generation without awaiting
    const bgTask = this.generateAndCacheNgWords(sessionId, characterType, locale, "start")
      .then(() => undefined)
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
      logger.debug("[chat] loaded cached NG words", {
        sessionId,
        count: cachedNgWords.length,
      });
    } else {
      logger.info("[chat] NG word cache missing, regenerating", {
        sessionId,
        characterType: session.characterType,
        locale,
      });
      try {
        session.ngWords = await this.generateAndCacheNgWords(session.id, session.characterType, locale, "chat");
      } catch (err: unknown) {
        logger.warn("[chat] NG word cache miss regeneration failed, continuing with current session words:", err);
      }
    }

    // Check NG words
    const hitNgWord = session.checkNgWord(message);
    if (hitNgWord) {
      logger.info("[chat] NG word hit", { sessionId, hitWord: hitNgWord.word, messageCount: session.messageCount + 1 });
      const angryReply = await this.ai.getShockResponse(
        sessionId,
        session.characterType,
        session.username,
        hitNgWord.word,
        locale,
      );
      session.incrementMessageCount();
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
    logger.debug("[chat] message processed", {
      sessionId,
      scoreRaw: score.raw,
      scoreAdjusted: score.adjusted,
      remainingChats: session.remainingChats,
      status: session.status,
      emotion,
    });

    if (session.status === "completed") {
      this.ngWordCache.delete(sessionId);
      logger.info("[chat] session completed", { sessionId, totalMessages: session.messageCount });
    }

    return { reply, score, emotion, isGameOver: false, remainingChats: session.remainingChats };
  }
}
