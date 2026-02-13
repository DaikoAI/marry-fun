import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url().optional(),
    OPENCLAW_API_BASE_URL: z.string().url(),
    OPENCLAW_API_KEY: z.string().min(1),
  },
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    OPENCLAW_API_BASE_URL: process.env.OPENCLAW_API_BASE_URL,
    OPENCLAW_API_KEY: process.env.OPENCLAW_API_KEY,
  },
  emptyStringAsUndefined: true,
});
