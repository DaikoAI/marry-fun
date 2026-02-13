import type { AiChatAdapter } from "@/domain/adapter/ai-chat";
import type { CharacterType } from "@/domain/values/character-type";
import { EMOTIONS, isEmotion } from "@/domain/values/emotion";
import type { Emotion } from "@/domain/values/emotion";
import type { Locale } from "@/domain/values/locale";
import { CHAT_SYSTEM_PROMPT } from "@/lib/soul-prompt.generated";
import { extractJson } from "@/lib/extract-json";
import { NGWORD_SYSTEM_PROMPT } from "@/infrastructure/prompts/openclaw-prompts";
import { logger } from "@/utils/logger";
import OpenAI from "openai";
import { z } from "zod";

const MAX_STRUCTURED_ATTEMPTS = 2;

const chatResponseSchema = z.object({
  message: z.string().min(1),
  score: z.number().int().min(1).max(10),
  emotion: z
    .enum(EMOTIONS as unknown as [string, ...string[]])
    .optional()
    .transform((v): Emotion => (v && isEmotion(v) ? v : "default")),
});

const ngWordsResponseSchema = z
  .object({
    words: z.array(z.string().min(1)).min(25).max(35),
  })
  .strict();

const CHAT_RESPONSE_FORMAT = {
  type: "json_schema",
  json_schema: {
    name: "marry_fun_chat_response",
    strict: true,
    schema: {
      type: "object",
      properties: {
        message: { type: "string" },
        score: { type: "integer", minimum: 1, maximum: 10 },
        emotion: {
          type: "string",
          enum: EMOTIONS as unknown as string[],
        },
      },
      required: ["message", "score", "emotion"],
      additionalProperties: false,
    },
  },
} as const;

const NGWORDS_RESPONSE_FORMAT = {
  type: "json_schema",
  json_schema: {
    name: "marry_fun_ngwords_response",
    strict: true,
    schema: {
      type: "object",
      properties: {
        words: {
          type: "array",
          items: { type: "string" },
          minItems: 25,
          maxItems: 35,
        },
      },
      required: ["words"],
      additionalProperties: false,
    },
  },
} as const;

function extractBalancedJsonLike(text: string): string | null {
  const starts = [text.indexOf("{"), text.indexOf("[")].filter(index => index >= 0).sort((a, b) => a - b);

  for (const start of starts) {
    const open = text[start];
    const close = open === "{" ? "}" : "]";
    let depth = 0;
    let inString = false;
    let escaped = false;

    for (let i = start; i < text.length; i += 1) {
      const ch = text[i];

      if (inString) {
        if (escaped) {
          escaped = false;
          continue;
        }
        if (ch === "\\") {
          escaped = true;
          continue;
        }
        if (ch === '"') {
          inString = false;
        }
        continue;
      }

      if (ch === '"') {
        inString = true;
        continue;
      }
      if (ch === open) {
        depth += 1;
      } else if (ch === close) {
        depth -= 1;
        if (depth === 0) {
          return text.slice(start, i + 1).trim();
        }
      }
    }
  }

  return null;
}

/** Safely parse JSON, returning null on failure. */
function safeJsonParse(text: string): unknown {
  const candidates = [text.trim(), extractJson(text)].filter(Boolean);
  const balanced = extractBalancedJsonLike(text);
  if (balanced) {
    candidates.push(balanced);
  }

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate);
    } catch {
      continue;
    }
  }
  return null;
}

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

const LOCALE_INSTRUCTIONS: Record<Locale, string> = {
  en: "You MUST respond in English.",
  ja: "日本語で応答してください。",
};

export class AiChatMoltworker implements AiChatAdapter {
  private readonly client: OpenAI;

  constructor(
    private readonly baseURL: string,
    private readonly apiKey: string,
  ) {
    // Explicitly pass fetch to ensure the SDK uses the Fetch API instead of
    // Node.js http module. In opennextjs-cloudflare (Workerd + nodejs_compat),
    // the SDK misdetects the environment as Node.js and uses the broken http polyfill.
    this.client = new OpenAI({ baseURL, apiKey, fetch: globalThis.fetch });
  }

  private async createStructuredObject<T>(
    label: string,
    request: () => Promise<OpenAI.Chat.Completions.ChatCompletion>,
    schema: z.ZodSchema<T>,
    options?: { finalLogLevel?: "warn" | "error" },
  ): Promise<T> {
    let lastError: unknown = new Error(`${label} failed`);

    for (let attempt = 1; attempt <= MAX_STRUCTURED_ATTEMPTS; attempt += 1) {
      try {
        const completion = await request();

        const choice = completion.choices.at(0);
        if (!choice) {
          throw new Error("No completion choice returned");
        }
        if (choice.finish_reason !== "stop") {
          throw new Error(`Unexpected finish_reason: ${choice.finish_reason}`);
        }
        if (choice.message.refusal) {
          throw new Error(`Model refusal: ${choice.message.refusal}`);
        }
        if (typeof choice.message.content !== "string" || !choice.message.content.trim()) {
          throw new Error("Empty response content");
        }

        const parsed = safeJsonParse(choice.message.content);
        if (parsed === null) {
          throw new Error("Invalid JSON response from model");
        }

        return schema.parse(parsed);
      } catch (error) {
        lastError = error;
        const errorDetail =
          error instanceof Error ?
            `${error.constructor.name}: ${error.message}${error.cause ? ` | cause: ${toErrorMessage(error.cause)}` : ""}`
          : String(error);
        if (attempt < MAX_STRUCTURED_ATTEMPTS) {
          logger.warn(
            `[AiChatMoltworker] ${label} validation failed (attempt ${String(attempt)}/${String(MAX_STRUCTURED_ATTEMPTS)}): ${errorDetail}`,
          );
        } else {
          const finalLogLevel = options?.finalLogLevel ?? "error";
          if (finalLogLevel === "warn") {
            logger.warn(`[AiChatMoltworker] ${label} final failure: ${errorDetail}`);
          } else {
            logger.error(`[AiChatMoltworker] ${label} final failure: ${errorDetail}`);
          }
        }
      }
    }

    throw new Error(
      `[AiChatMoltworker] ${label} failed after ${String(MAX_STRUCTURED_ATTEMPTS)} attempts: ${toErrorMessage(lastError)}`,
    );
  }

  async generateNgWords(sessionId: string, characterType: CharacterType, locale: Locale): Promise<string[]> {
    const langInstruction = LOCALE_INSTRUCTIONS[locale];
    const parsed = await this.createStructuredObject(
      "generateNgWords",
      async () =>
        this.client.chat.completions.create({
          model: "openclaw:main",
          user: sessionId,
          response_format: NGWORDS_RESPONSE_FORMAT,
          messages: [
            { role: "system", content: NGWORD_SYSTEM_PROMPT },
            {
              role: "user",
              content: `${langInstruction}\nCharacter type: ${characterType}\nGenerate 30 NG words (taboo words) for this character: 5 character-specific trigger words + 25 random everyday short words. Each word must be a single short word (Japanese: 1-4 chars, English: 1-8 chars). Respond as JSON: { "words": ["w1", "w2", ..., "w30"] }`,
            },
          ],
        }),
      ngWordsResponseSchema,
      { finalLogLevel: "warn" },
    );

    return parsed.words;
  }

  async sendMessage(
    sessionId: string,
    characterType: CharacterType,
    username: string,
    message: string,
    locale: Locale,
  ) {
    const langInstruction = LOCALE_INSTRUCTIONS[locale];
    const parsed = await this.createStructuredObject(
      "sendMessage",
      async () =>
        this.client.chat.completions.create({
          model: "openclaw:main",
          user: sessionId,
          response_format: CHAT_RESPONSE_FORMAT,
          messages: [
            { role: "system", content: CHAT_SYSTEM_PROMPT },
            {
              role: "user",
              content:
                message === "__INIT__" ?
                  `${langInstruction}\nCharacter type: ${characterType}\nUsername: ${username}\nGreet the user for the first time. Respond in JSON with message, score, and emotion (required): { "message": "greeting", "score": 5, "emotion": "joy" }`
                : `${langInstruction}\nUser message: ${message}\nRespond in JSON: { "message": "your reply", "score": 1-10, "emotion": "default"|"joy"|"embarrassed"|"angry"|"sad" }`,
            },
          ],
        }),
      chatResponseSchema,
    );

    const emotion: Emotion =
      typeof parsed.emotion === "string" && isEmotion(parsed.emotion) ? parsed.emotion : "default";
    return { message: parsed.message, score: parsed.score, emotion };
  }

  async getShockResponse(
    sessionId: string,
    characterType: CharacterType,
    username: string,
    hitWord: string,
    locale: Locale,
  ): Promise<string> {
    const fallback = "Why would you say that...! I can't believe it...!";
    try {
      const langInstruction = LOCALE_INSTRUCTIONS[locale];
      const completion = await this.client.chat.completions.create({
        model: "openclaw:main",
        user: sessionId,
        messages: [
          { role: "system", content: CHAT_SYSTEM_PROMPT },
          {
            role: "user",
            content: `${langInstruction}\n${username} said the taboo word "${hitWord}". As a ${characterType} character, react with a shocked and heartbroken one-liner. You are devastated and can't believe they said that word. Express deep shock and sadness, not anger. Plain text only, no JSON.`,
          },
        ],
      });

      return completion.choices[0]?.message?.content ?? fallback;
    } catch (error) {
      logger.warn(
        `[AiChatMoltworker] getShockResponse failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      return fallback;
    }
  }
}
