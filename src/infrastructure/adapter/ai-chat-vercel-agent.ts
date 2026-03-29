import type { AiChatAdapter } from "@/domain/adapter/ai-chat";
import type { CharacterType } from "@/domain/values/character-type";
import { isEmotion } from "@/domain/values/emotion";
import type { Emotion } from "@/domain/values/emotion";
import type { Locale } from "@/domain/values/locale";
import { logger } from "@/utils/logger";
import { clawChatAgent, clawNgWordAgent, clawShockAgent } from "../ai/claw-agents";

const LOCALE_INSTRUCTIONS: Record<Locale, string> = {
  en: "You MUST respond in English.",
  ja: "日本語で応答してください。",
};

const SHOCK_FALLBACK = "Why would you say that...! I can't believe it...!";

interface StructuredChatResult {
  output?: {
    message: string;
    score: number;
    emotion: string;
  };
}

interface StructuredNgWordResult {
  output?: {
    words: string[];
  };
}

interface ShockResult {
  text: string;
}

export interface ChatAgent {
  generate: (args: { prompt: string }) => Promise<StructuredChatResult>;
}

export interface NgWordAgent {
  generate: (args: { prompt: string }) => Promise<StructuredNgWordResult>;
}

export interface ShockAgent {
  generate: (args: { prompt: string }) => Promise<ShockResult>;
}

export interface AiChatVercelAgentDependencies {
  chatAgent: ChatAgent;
  ngWordAgent: NgWordAgent;
  shockAgent: ShockAgent;
}

export class AiChatVercelAgent implements AiChatAdapter {
  constructor(
    private readonly agents: AiChatVercelAgentDependencies = {
      chatAgent: clawChatAgent,
      ngWordAgent: clawNgWordAgent,
      shockAgent: clawShockAgent,
    },
  ) {}

  async generateNgWords(sessionId: string, characterType: CharacterType, locale: Locale): Promise<string[]> {
    const langInstruction = LOCALE_INSTRUCTIONS[locale];
    const result = await this.agents.ngWordAgent.generate({
      prompt:
        `${langInstruction}\n` +
        `Session ID: ${sessionId}\n` +
        `Character type: ${characterType}\n` +
        "Generate 30 NG words: 5 character-specific trigger words + 25 short everyday words.",
    });

    if (!result.output || result.output.words.length === 0) {
      throw new Error("[AiChatVercelAgent] generateNgWords returned no words");
    }

    return result.output.words;
  }

  async sendMessage(
    sessionId: string,
    characterType: CharacterType,
    username: string,
    message: string,
    locale: Locale,
  ) {
    const langInstruction = LOCALE_INSTRUCTIONS[locale];
    const prompt =
      message === "__INIT__" ?
        `${langInstruction}\nSession ID: ${sessionId}\nCharacter type: ${characterType}\nUsername: ${username}\nGreet the user for the first time.`
      : `${langInstruction}\nSession ID: ${sessionId}\nCharacter type: ${characterType}\nUsername: ${username}\nUser message: ${message}`;

    const result = await this.agents.chatAgent.generate({ prompt });
    if (!result.output) {
      throw new Error("[AiChatVercelAgent] sendMessage returned no structured output");
    }

    const emotion = isEmotion(result.output.emotion) ? result.output.emotion : "default";
    return {
      message: result.output.message,
      score: result.output.score,
      emotion,
    };
  }

  async getShockResponse(
    sessionId: string,
    characterType: CharacterType,
    username: string,
    hitWord: string,
    locale: Locale,
  ): Promise<string> {
    try {
      const langInstruction = LOCALE_INSTRUCTIONS[locale];
      const result = await this.agents.shockAgent.generate({
        prompt:
          `${langInstruction}\n` +
          `Session ID: ${sessionId}\n` +
          `Character type: ${characterType}\n` +
          `Username: ${username}\n` +
          `${username} said the taboo word "${hitWord}". ` +
          "React with a shocked and heartbroken one-liner. Plain text only.",
      });

      return result.text.trim() || SHOCK_FALLBACK;
    } catch (error) {
      logger.warn(
        `[AiChatVercelAgent] getShockResponse failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      return SHOCK_FALLBACK;
    }
  }
}
