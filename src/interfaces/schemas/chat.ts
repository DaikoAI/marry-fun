import { CHARACTER_TYPES } from "@/domain/values/character-type";
import { EMOTIONS } from "@/domain/values/emotion";
import { z } from "zod";

export { EMOTIONS };

// --- Request ---

export const localeSchema = z.enum(["en", "ja"]).default("en");

export type Locale = z.infer<typeof localeSchema>;

const startSchema = z.object({
  isInit: z.literal(true),
  username: z.string().min(1).max(20),
  locale: localeSchema,
});

const messageSchema = z.object({
  isInit: z.literal(false),
  sessionId: z.string().uuid(),
  message: z.string().min(1).max(500),
  locale: localeSchema,
});

export const chatRequestSchema = z.discriminatedUnion("isInit", [startSchema, messageSchema]);

export type ChatRequest = z.infer<typeof chatRequestSchema>;
export type StartRequest = z.infer<typeof startSchema>;
export type MessageRequest = z.infer<typeof messageSchema>;

// --- Response ---

export const startResponseSchema = z.object({
  type: z.literal("start"),
  sessionId: z.string().uuid(),
  characterType: z.enum(CHARACTER_TYPES),
  greeting: z.string(),
});

export const messageResponseSchema = z.object({
  type: z.literal("message"),
  reply: z.string(),
  score: z.object({
    raw: z.number().int().min(1).max(10),
    adjusted: z.number().int(),
  }),
  emotion: z.enum(EMOTIONS),
});

export const gameOverResponseSchema = z.object({
  type: z.literal("game_over"),
  reply: z.string(),
  hitWord: z.string().min(1),
});

export const errorResponseSchema = z.object({
  type: z.literal("error"),
  code: z.string().min(1),
  message: z.string().min(1),
});

export const chatSuccessResponseSchema = z.discriminatedUnion("type", [
  startResponseSchema,
  messageResponseSchema,
  gameOverResponseSchema,
]);

export const chatResponseSchema = z.discriminatedUnion("type", [
  startResponseSchema,
  messageResponseSchema,
  gameOverResponseSchema,
  errorResponseSchema,
]);

export type StartResponse = z.infer<typeof startResponseSchema>;
export type MessageResponse = z.infer<typeof messageResponseSchema>;
export type GameOverResponse = z.infer<typeof gameOverResponseSchema>;
export type ErrorResponse = z.infer<typeof errorResponseSchema>;
export type ChatResponse = z.infer<typeof chatResponseSchema>;
