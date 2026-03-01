import { toNextJsHandler } from "better-auth/next-js";

import { getAuth, getAuthBaseUrl } from "@/lib/auth/auth";
import { ensureOriginHeader, resolveWeb3RequestDomain } from "@/lib/auth/web3-domain";
import { logger } from "@/utils/logger";

// Note: export const runtime = "edge" is not supported by @opennextjs/cloudflare
export const dynamic = "force-dynamic";

function truncate(value: string | null, maxLength = 180): string | null {
  if (!value) {
    return null;
  }

  return value.length > maxLength ? `${value.slice(0, maxLength)}…` : value;
}

function parseHost(value: string | null): string | null {
  if (!value) {
    return null;
  }

  try {
    return new URL(value).host;
  } catch {
    return null;
  }
}

function readOAuthDebugQuery(url: URL) {
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  return {
    error: url.searchParams.get("error"),
    errorDescription: truncate(url.searchParams.get("error_description")),
    hasCode: Boolean(code),
    codeLength: code?.length ?? 0,
    hasState: Boolean(state),
    stateLength: state?.length ?? 0,
    callbackURLHost: parseHost(url.searchParams.get("callbackURL")),
  };
}

function shouldLogAuthTrace(pathname: string): boolean {
  return (
    pathname.endsWith("/link-social") ||
    pathname.endsWith("/callback/twitter") ||
    pathname.endsWith("/error") ||
    pathname.endsWith("/x/link-status")
  );
}

async function runAuthHandler(request: Request, method: "GET" | "POST") {
  const startedAt = Date.now();
  const url = new URL(request.url);
  const authBaseUrl = getAuthBaseUrl();
  const authBaseHost = new URL(authBaseUrl).host;
  const web3Domain = resolveWeb3RequestDomain(request, getAuthBaseUrl());
  const shouldTrace = shouldLogAuthTrace(url.pathname);
  const requestMeta = {
    method,
    path: url.pathname,
    host: url.host,
    origin: request.headers.get("origin"),
    referer: request.headers.get("referer"),
    authBaseHost,
    web3Domain,
    query: readOAuthDebugQuery(url),
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
        redirectErrorDescription: truncate(redirectUrl?.searchParams.get("error_description") ?? null),
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
          callbackErrorDescription: truncate(redirectUrl.searchParams.get("error_description")),
          requestQuery: readOAuthDebugQuery(url),
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
