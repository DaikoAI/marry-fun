import type { AiChatAdapter } from "@/domain/adapter/ai-chat";
import { GameSession } from "@/domain/entities/game-session";
import { SessionNotFoundError } from "@/domain/errors/session-not-found-error";
import type { GameSessionRepository } from "@/domain/repositories/game-session-repository";
import { randomCharacterType } from "@/domain/values/character-type";
import type { CharacterType } from "@/domain/values/character-type";
import type { Emotion } from "@/domain/values/emotion";
import type { Locale } from "@/domain/values/locale";
import { NgWord } from "@/domain/values/ng-word";
import { Score } from "@/domain/values/score";

export interface StartGameResult {
  sessionId: string;
  characterType: CharacterType;
  greeting: string;
  backgroundTask?: Promise<void>;
}

export interface ChatResult {
  reply: string;
  score?: Score;
  emotion?: Emotion;
  hitWord?: string;
  isGameOver: boolean;
}

export class GameSessionUseCase {
  constructor(
    private readonly repo: GameSessionRepository,
    private readonly ai: AiChatAdapter,
  ) {}

  async startGame(username: string, locale: Locale): Promise<StartGameResult> {
    const sessionId = crypto.randomUUID();
    const characterType = randomCharacterType();

    // Only await greeting — NG word generation runs in the background
    const { message: greeting } = await this.ai.sendMessage(sessionId, characterType, username, "__INIT__", locale);

    const session = new GameSession(sessionId, username, characterType);
    this.repo.save(session);

    // Fire NG word generation without awaiting
    const bgTask = this.ai
      .generateNgWords(sessionId, characterType, locale)
      .then(rawNgWords => {
        const existing = this.repo.findById(sessionId);
        if (existing) {
          existing.ngWords = rawNgWords.map(w => new NgWord(w));
        }
      })
      .catch((err: unknown) => {
        console.warn("[startGame] NG word generation failed, continuing without NG words:", err);
      });

    return { sessionId, characterType, greeting, backgroundTask: bgTask };
  }

  async chat(sessionId: string, message: string, locale: Locale): Promise<ChatResult> {
    const session = this.repo.findById(sessionId);
    if (!session) {
      throw new SessionNotFoundError(sessionId);
    }

    // Check NG words with whatever is available now (don't await pending)
    const hitNgWord = session.checkNgWord(message);
    if (hitNgWord) {
      const angryReply = await this.ai.getShockResponse(
        sessionId,
        session.characterType,
        session.username,
        hitNgWord.word,
        locale,
      );
      session.status = "game_over";
      this.repo.delete(sessionId);
      return { reply: angryReply, hitWord: hitNgWord.word, isGameOver: true };
    }

    const {
      message: reply,
      score: rawScore,
      emotion,
    } = await this.ai.sendMessage(sessionId, session.characterType, session.username, message, locale);
    const score = Score.fromRaw(rawScore);
    session.incrementMessageCount();

    return { reply, score, emotion, isGameOver: false };
  }
}
