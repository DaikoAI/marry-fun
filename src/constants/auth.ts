export const AUTH_PRIMARY_ORIGIN = "https://marry.fun";
export const AUTH_WWW_ORIGIN = "https://www.marry.fun";
export const AUTH_DEV_WORKERS_ORIGIN = "https://marry-fun-dev.yamadaasuma.workers.dev";

export const AUTH_LOCAL_TRUSTED_ORIGIN_PATTERNS = [
  "http://localhost:*",
  "http://127.0.0.1:*",
  "http://192.168.*.*:*",
] as const;

export const AUTH_STATIC_TRUSTED_ORIGINS = [AUTH_PRIMARY_ORIGIN, AUTH_WWW_ORIGIN, AUTH_DEV_WORKERS_ORIGIN] as const;

export const WEB3_ALLOWED_STATIC_DOMAINS = [
  "marry.fun",
  "www.marry.fun",
  "marry-fun-dev.yamadaasuma.workers.dev",
  "localhost",
  "127.0.0.1",
] as const;
