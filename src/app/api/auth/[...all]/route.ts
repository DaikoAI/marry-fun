import { toNextJsHandler } from "better-auth/next-js";

import { getAuth, getAuthBaseUrl } from "@/lib/auth/auth";
import { ensureOriginHeader, resolveWeb3RequestDomain } from "@/lib/auth/web3-domain";
import { logger } from "@/utils/logger";

// Note: export const runtime = "edge" is not supported by @opennextjs/cloudflare
export const dynamic = "force-dynamic";

function shouldTraceAuthRequest(pathname: string): boolean {
  return pathname.endsWith("/callback/twitter") || pathname.endsWith("/error");
}

async function runAuthHandler(request: Request, method: "GET" | "POST") {
  const startedAt = Date.now();
  const url = new URL(request.url);
  const authBaseUrl = getAuthBaseUrl();
  const authBaseHost = new URL(authBaseUrl).host;
  const web3Domain = resolveWeb3RequestDomain(request, getAuthBaseUrl());
  const shouldTrace = shouldTraceAuthRequest(url.pathname);
  const requestMeta = {
    method,
    path: url.pathname,
    host: url.host,
    hasCode: url.searchParams.has("code"),
    hasState: url.searchParams.has("state"),
    error: url.searchParams.get("error"),
  };

  if (shouldTrace) {
    logger.info("[auth] request start", requestMeta);
  }

  try {
    const auth = await getAuth(request);
    const handler = toNextJsHandler(auth);
    const normalizedRequest = method === "POST" ? ensureOriginHeader(request, web3Domain) : request;
    const response = method === "GET" ? await handler.GET(normalizedRequest) : await handler.POST(normalizedRequest);
    const durationMs = Date.now() - startedAt;
    const location = response.headers.get("location");
    const redirectUrl = location ? new URL(location, url) : null;

    if (shouldTrace) {
      logger.info("[auth] request end", {
        ...requestMeta,
        status: response.status,
        durationMs,
        redirectPath: redirectUrl?.pathname ?? null,
        redirectError: redirectUrl?.searchParams.get("error") ?? null,
      });
    }

    if (url.pathname.endsWith("/callback/twitter")) {
      if (url.host !== authBaseHost) {
        logger.warn("[auth] callback host mismatch detected", {
          requestHost: url.host,
          authBaseHost,
          note: "BETTER_AUTH_URL host should match the URL used to start OAuth",
        });
      }

      if (redirectUrl?.pathname.endsWith("/api/auth/error")) {
        logger.error("[auth] twitter callback redirected to auth error", {
          path: url.pathname,
          callbackError: redirectUrl.searchParams.get("error"),
          hasCode: url.searchParams.has("code"),
          hasState: url.searchParams.has("state"),
        });
      }
    }

    return response;
  } catch (error) {
    logger.error("[auth] request failed", {
      ...requestMeta,
      durationMs: Date.now() - startedAt,
      message: error instanceof Error ? error.message : "unknown auth handler error",
    });
    throw error;
  }
}

export async function GET(request: Request) {
  return runAuthHandler(request, "GET");
}

export async function POST(request: Request) {
  return runAuthHandler(request, "POST");
}
