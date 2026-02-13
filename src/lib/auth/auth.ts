import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { betterAuth } from "better-auth";
import { generateRandomString } from "better-auth/crypto";
import { createMessage } from "better-auth-web3/util";
import { web3 } from "better-auth-web3";
import { PublicKey } from "@solana/web3.js";
import nacl from "tweetnacl";

import { env } from "@/env";
import { getDb } from "@/infrastructure/db/client";
import * as schema from "@/infrastructure/db/schema";
import { resolveWeb3UserNameForCreation } from "@/lib/auth/web3-signup-username";

let cachedAuth: Awaited<ReturnType<typeof buildAuth>> | null = null;

function getAuthBaseUrl(): string {
  return env.BETTER_AUTH_URL ?? "http://localhost:3000";
}

function getAuthSecret(): string {
  if (!env.BETTER_AUTH_SECRET) {
    throw new Error("BETTER_AUTH_SECRET is required for Better Auth");
  }
  return env.BETTER_AUTH_SECRET;
}

function getTwitterConfig() {
  if (env.AUTH_TWITTER_CLIENT_ID && env.AUTH_TWITTER_CLIENT_SECRET) {
    return {
      twitter: {
        clientId: env.AUTH_TWITTER_CLIENT_ID,
        clientSecret: env.AUTH_TWITTER_CLIENT_SECRET,
      },
    };
  }
  return {};
}

async function buildAuth() {
  const db = await getDb();

  return betterAuth({
    baseURL: getAuthBaseUrl(),
    secret: getAuthSecret(),
    trustedOrigins: [
      getAuthBaseUrl(),
      "http://localhost:*",
      "http://127.0.0.1:*",
      "http://192.168.*.*:*",
      "https://marry.fun",
      "https://marry-fun.yamadaasuma.workers.dev",
    ],
    database: drizzleAdapter(db, {
      provider: "sqlite",
      schema,
    }),
    databaseHooks: {
      user: {
        create: {
          before: async (newUser, context) => {
            await Promise.resolve();
            const headerUsername = context?.headers?.get("x-marry-username");
            const resolved = resolveWeb3UserNameForCreation(context?.path, headerUsername);

            if (!resolved.isWeb3VerifyPath) {
              return;
            }

            return {
              data: {
                ...newUser,
                name: resolved.username ?? "",
              },
            };
          },
        },
      },
    },
    socialProviders: getTwitterConfig(),
    plugins: [
      web3({
        domain: new URL(getAuthBaseUrl()).hostname,
        anonymous: true,
        getNonce: async () => {
          const nonce = await Promise.resolve(generateRandomString(32, "a-z", "A-Z", "0-9"));
          return nonce;
        },
        verifySVMMessage: async ({ message, signature, address, nonce, domain }) => {
          await Promise.resolve();

          try {
            const expected = createMessage(domain, nonce, "Sign in to marry.fun.");
            if (message !== expected) {
              return false;
            }

            const publicKey = new PublicKey(address);
            const messageBytes = new TextEncoder().encode(message);
            const signatureBytes = Buffer.from(signature, "base64");
            return nacl.sign.detached.verify(messageBytes, signatureBytes, publicKey.toBytes());
          } catch {
            return false;
          }
        },
      }),
    ],
  });
}

export async function getAuth() {
  if (!cachedAuth) {
    cachedAuth = await buildAuth();
  }
  return cachedAuth;
}
