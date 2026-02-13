import type { CharacterType } from "@/domain/values/character-type";
import type { Emotion } from "@/domain/values/emotion";
import type { Locale } from "@/domain/values/locale";

export interface AiChatAdapter {
  generateNgWords: (sessionId: string, characterType: CharacterType, locale: Locale) => Promise<string[]>;
  sendMessage: (
    sessionId: string,
    characterType: CharacterType,
    username: string,
    message: string,
    locale: Locale,
  ) => Promise<{ message: string; score: number; emotion: Emotion }>;
  getShockResponse: (
    sessionId: string,
    characterType: CharacterType,
    username: string,
    hitWord: string,
    locale: Locale,
  ) => Promise<string>;
}
