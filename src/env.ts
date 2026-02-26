import { createEnv } from "@t3-oss/env-nextjs";
import * as z from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url().optional(),
    BETTER_AUTH_URL: z.string().url().optional(),
    BETTER_AUTH_SECRET: z.string().min(1).optional(),
    AUTH_TWITTER_CLIENT_ID: z.string().min(1).optional(),
    AUTH_TWITTER_CLIENT_SECRET: z.string().min(1).optional(),
    CLOUDFLARE_ACCOUNT_ID: z.string().min(1).optional(),
    CLOUDFLARE_DATABASE_ID: z.string().min(1).optional(),
    CLOUDFLARE_D1_TOKEN: z.string().min(1).optional(),
    R2_PROFILE_IMAGE_PUBLIC_BASE_URL: z.string().url().optional(),
    RUNWARE_API_KEY: z.string().min(1).optional(),
    RUNWARE_MODEL: z.string().min(1).optional(),
    OPENCLAW_API_BASE_URL: z.string().url(),
    OPENCLAW_API_KEY: z.string().min(1),
  },
  client: {
    NEXT_PUBLIC_SOLANA_RPC_URL: z.string().url().optional(),
  },
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    AUTH_TWITTER_CLIENT_ID: process.env.AUTH_TWITTER_CLIENT_ID,
    AUTH_TWITTER_CLIENT_SECRET: process.env.AUTH_TWITTER_CLIENT_SECRET,
    CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID,
    CLOUDFLARE_DATABASE_ID: process.env.CLOUDFLARE_DATABASE_ID,
    CLOUDFLARE_D1_TOKEN: process.env.CLOUDFLARE_D1_TOKEN,
    R2_PROFILE_IMAGE_PUBLIC_BASE_URL: process.env.R2_PROFILE_IMAGE_PUBLIC_BASE_URL,
    RUNWARE_API_KEY: process.env.RUNWARE_API_KEY,
    RUNWARE_MODEL: process.env.RUNWARE_MODEL,
    OPENCLAW_API_BASE_URL: process.env.OPENCLAW_API_BASE_URL,
    OPENCLAW_API_KEY: process.env.OPENCLAW_API_KEY,
    NEXT_PUBLIC_SOLANA_RPC_URL: process.env.NEXT_PUBLIC_SOLANA_RPC_URL,
  },
  emptyStringAsUndefined: true,
});
