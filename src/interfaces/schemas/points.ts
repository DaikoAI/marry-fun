import { z } from "zod";

export const addPointsRequestSchema = z.object({
  amount: z
    .number()
    .int()
    .refine(value => value !== 0, "amount must not be 0"),
  reason: z.string().trim().min(1).max(120),
  idempotencyKey: z.string().trim().min(1).max(128).optional(),
});

export type AddPointsRequest = z.infer<typeof addPointsRequestSchema>;

export const leaderboardEntrySchema = z.object({
  rank: z.number().int().min(1),
  userId: z.string().min(1),
  displayName: z.string().min(1),
  points: z.number().int(),
});

export const leaderboardResponseSchema = z.object({
  generatedAt: z.string().datetime(),
  dailyWindow: z.object({
    start: z.string().datetime(),
    end: z.string().datetime(),
    timezone: z.literal("UTC"),
  }),
  total: z.array(leaderboardEntrySchema),
  daily: z.array(leaderboardEntrySchema),
});

export type LeaderboardResponse = z.infer<typeof leaderboardResponseSchema>;
