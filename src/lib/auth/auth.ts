import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { betterAuth } from "better-auth";
import { generateRandomString } from "better-auth/crypto";
import { createMessage } from "better-auth-web3/util";
import { web3 } from "better-auth-web3";
import { PublicKey } from "@solana/web3.js";
import nacl from "tweetnacl";

import { AUTH_LOCAL_TRUSTED_ORIGIN_PATTERNS, AUTH_STATIC_TRUSTED_ORIGINS } from "@/constants/auth";
import { env } from "@/env";
import { getDb } from "@/infrastructure/db/client";
import * as schema from "@/infrastructure/db/schema";
import { resolveWeb3RequestDomain } from "@/lib/auth/web3-domain";
import { resolveWeb3UserNameForCreation } from "@/lib/auth/web3-signup-username";
import { logger } from "@/utils/logger";

const cachedAuthByDomain = new Map<string, Awaited<ReturnType<typeof buildAuth>>>();

const X_PROFILE_URLS = [
  "https://api.x.com/2/users/me?user.fields=profile_image_url",
  "https://api.twitter.com/2/users/me?user.fields=profile_image_url",
] as const;

const X_EMAIL_URLS = [
  "https://api.x.com/2/users/me?user.fields=confirmed_email",
  "https://api.twitter.com/2/users/me?user.fields=confirmed_email",
] as const;

const X_RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);
const X_MAX_RETRIES = 2;

interface XProfileResponse {
  data?: {
    id?: string;
    name?: string;
    username?: string;
    email?: string;
    profile_image_url?: string;
  };
  [key: string]: unknown;
}

interface XFetchResponse {
  endpoint: string;
  status: number;
  statusText: string;
  body: string;
  ok: boolean;
}

function truncateForLog(value: string, limit = 300): string {
  if (value.length <= limit) {
    return value;
  }
  return `${value.slice(0, limit)}...`;
}

function parseJsonResponse(raw: string): unknown {
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function sleep(ms: number): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, ms));
}

function isRetryableStatus(status: number): boolean {
  return X_RETRYABLE_STATUS.has(status);
}

async function fetchXWithFallback(
  endpoints: readonly string[],
  accessToken: string,
  logLabel: string,
): Promise<XFetchResponse | null> {
  for (const endpoint of endpoints) {
    for (let attempt = 1; attempt <= X_MAX_RETRIES; attempt += 1) {
      try {
        const response = await fetch(endpoint, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        const body = await response.text();
        const result: XFetchResponse = {
          endpoint,
          status: response.status,
          statusText: response.statusText,
          body,
          ok: response.ok,
        };

        if (result.ok) {
          return result;
        }

        logger.warn("[auth/twitter] provider API response error", {
          label: logLabel,
          endpoint,
          attempt,
          status: result.status,
          statusText: result.statusText,
          responseBody: truncateForLog(result.body),
        });

        if (!isRetryableStatus(result.status) || attempt >= X_MAX_RETRIES) {
          break;
        }

        await sleep(250 * attempt);
      } catch (error) {
        logger.warn("[auth/twitter] provider API request exception", {
          label: logLabel,
          endpoint,
          attempt,
          message: error instanceof Error ? error.message : "unknown error",
        });

        if (attempt >= X_MAX_RETRIES) {
          break;
        }
        await sleep(250 * attempt);
      }
    }
  }

  return null;
}

export function getAuthBaseUrl(): string {
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
        async getUserInfo(token: { accessToken?: string }) {
          const accessToken = token.accessToken;
          if (!accessToken) return null;
          try {
            const profileResponse = await fetchXWithFallback(X_PROFILE_URLS, accessToken, "profile");
            if (!profileResponse) {
              logger.error("[auth/twitter] failed to fetch user profile", {
                note: "all profile endpoints failed or returned retryable errors",
              });
              return null;
            }
            const profile = parseJsonResponse(profileResponse.body) as XProfileResponse | null;

            if (!profileResponse.ok) {
              logger.error("[auth/twitter] failed to fetch user profile", {
                endpoint: profileResponse.endpoint,
                status: profileResponse.status,
                statusText: profileResponse.statusText,
                responseBody: truncateForLog(profileResponse.body),
              });
              return null;
            }

            if (!profile?.data?.id) {
              logger.error("[auth/twitter] profile response missing user id", {
                endpoint: profileResponse.endpoint,
                responseBody: truncateForLog(profileResponse.body),
              });
              return null;
            }

            const emailResponse = await fetchXWithFallback(X_EMAIL_URLS, accessToken, "confirmed_email");
            let emailVerified = false;
            let confirmedEmail: string | undefined;

            if (emailResponse?.ok) {
              const emailData = parseJsonResponse(emailResponse.body) as { data?: { confirmed_email?: string } } | null;
              confirmedEmail = emailData?.data?.confirmed_email;
            }

            if (confirmedEmail) {
              profile.data.email = confirmedEmail;
              emailVerified = true;
            } else if (emailResponse && !emailResponse.ok) {
              logger.warn("[auth/twitter] failed to fetch confirmed email", {
                endpoint: emailResponse.endpoint,
                status: emailResponse.status,
                statusText: emailResponse.statusText,
                responseBody: truncateForLog(emailResponse.body),
              });
            } else if (!emailResponse) {
              logger.warn("[auth/twitter] failed to fetch confirmed email", {
                note: "all confirmed_email endpoints failed",
              });
            }

            return {
              user: {
                id: profile.data.id,
                name: profile.data.name ?? "",
                email: profile.data.email || profile.data.username || null,
                image: profile.data.profile_image_url,
                emailVerified,
              },
              data: profile,
            };
          } catch (error) {
            logger.error("[auth/twitter] exception while fetching user info", {
              message: error instanceof Error ? error.message : "unknown error",
            });
            return null;
          }
        },
      },
    };
  }
  return {};
}

async function buildAuth(web3Domain: string) {
  const db = await getDb();
  const authBaseUrl = getAuthBaseUrl();

  return betterAuth({
    baseURL: authBaseUrl,
    secret: getAuthSecret(),
    account: {
      accountLinking: {
        enabled: true,
        allowDifferentEmails: true,
        trustedProviders: ["twitter"],
      },
    },
    trustedOrigins: [authBaseUrl, ...AUTH_LOCAL_TRUSTED_ORIGIN_PATTERNS, ...AUTH_STATIC_TRUSTED_ORIGINS],
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
        domain: web3Domain,
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

export async function getAuth(request?: Request) {
  const web3Domain = resolveWeb3RequestDomain(request, getAuthBaseUrl());
  const cachedAuth = cachedAuthByDomain.get(web3Domain);
  if (cachedAuth) {
    return cachedAuth;
  }

  const auth = await buildAuth(web3Domain);
  cachedAuthByDomain.set(web3Domain, auth);
  return auth;
}
