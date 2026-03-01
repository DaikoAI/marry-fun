import { WEB3_ALLOWED_STATIC_DOMAINS } from "@/constants/auth";

const PRIVATE_LAN_IPV4_HOST_PATTERN = /^192\.168\.\d{1,3}\.\d{1,3}$/;
const STATIC_ALLOWED_WEB3_DOMAINS = new Set<string>(WEB3_ALLOWED_STATIC_DOMAINS);

function getFirstHeaderValue(value: string | null | undefined): string | null {
  const normalized = value?.split(",")[0]?.trim() ?? "";
  return normalized.length > 0 ? normalized : null;
}

function parseHostnameFromUrlLike(value: string | null | undefined): string | null {
  const normalized = getFirstHeaderValue(value);
  if (!normalized) {
    return null;
  }

  try {
    return new URL(normalized).hostname;
  } catch {
    // Host header values are usually host[:port], so parse via synthetic URL.
    try {
      return new URL(`http://${normalized}`).hostname;
    } catch {
      return null;
    }
  }
}

function isAllowedWeb3Domain(domain: string, fallbackDomain: string): boolean {
  if (domain === fallbackDomain) {
    return true;
  }

  if (STATIC_ALLOWED_WEB3_DOMAINS.has(domain)) {
    return true;
  }

  return PRIVATE_LAN_IPV4_HOST_PATTERN.test(domain);
}

export function resolveWeb3RequestDomain(request: Request | undefined, authBaseUrl: string): string {
  const fallbackDomain = new URL(authBaseUrl).hostname;

  if (!request) {
    return fallbackDomain;
  }

  const domainFromOrigin = parseHostnameFromUrlLike(request.headers.get("origin"));
  if (domainFromOrigin && isAllowedWeb3Domain(domainFromOrigin, fallbackDomain)) {
    return domainFromOrigin;
  }

  const domainFromForwardedHost = parseHostnameFromUrlLike(request.headers.get("x-forwarded-host"));
  if (domainFromForwardedHost && isAllowedWeb3Domain(domainFromForwardedHost, fallbackDomain)) {
    return domainFromForwardedHost;
  }

  const domainFromHost = parseHostnameFromUrlLike(request.headers.get("host"));
  if (domainFromHost && isAllowedWeb3Domain(domainFromHost, fallbackDomain)) {
    return domainFromHost;
  }

  const domainFromRequestUrl = parseHostnameFromUrlLike(request.url);
  if (domainFromRequestUrl && isAllowedWeb3Domain(domainFromRequestUrl, fallbackDomain)) {
    return domainFromRequestUrl;
  }

  return fallbackDomain;
}

export function ensureOriginHeader(request: Request, domain: string): Request {
  if (request.headers.has("origin")) {
    return request;
  }

  const requestUrl = new URL(request.url);
  const headers = new Headers(request.headers);
  headers.set("origin", `${requestUrl.protocol}//${domain}`);

  return new Request(request, { headers });
}
