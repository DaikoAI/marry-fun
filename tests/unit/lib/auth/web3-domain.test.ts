import { describe, expect, it } from "vitest";

import { ensureOriginHeader, resolveWeb3RequestDomain } from "@/lib/auth/web3-domain";

const BASE_URL = "https://marry.fun";

function createRequest(url: string, headers?: HeadersInit): Request {
  return new Request(url, {
    method: "POST",
    headers,
  });
}

describe("resolveWeb3RequestDomain", () => {
  it("origin ヘッダーが許可ドメインならその hostname を採用する", () => {
    const request = createRequest("https://marry.fun/api/auth/web3/svm/verify", {
      origin: "https://www.marry.fun",
      host: "marry.fun",
    });

    expect(resolveWeb3RequestDomain(request, BASE_URL)).toBe("www.marry.fun");
  });

  it("origin が無い場合は host ヘッダーの hostname を採用する", () => {
    const request = createRequest("https://marry.fun/api/auth/web3/svm/verify", {
      host: "marry-fun-dev.yamadaasuma.workers.dev",
    });

    expect(resolveWeb3RequestDomain(request, BASE_URL)).toBe("marry-fun-dev.yamadaasuma.workers.dev");
  });

  it("許可外ドメインしか取得できない場合は baseURL の hostname にフォールバックする", () => {
    const request = createRequest("https://marry.fun/api/auth/web3/svm/verify", {
      origin: "https://evil.example.com",
      host: "evil.example.com",
    });

    expect(resolveWeb3RequestDomain(request, BASE_URL)).toBe("marry.fun");
  });
});

describe("ensureOriginHeader", () => {
  it("origin ヘッダーが無い場合は補完する", () => {
    const request = createRequest("https://marry.fun/api/auth/web3/svm/verify", {
      host: "marry.fun",
    });

    const normalized = ensureOriginHeader(request, "marry.fun");
    expect(normalized.headers.get("origin")).toBe("https://marry.fun");
  });

  it("origin ヘッダーが既にある場合は上書きしない", () => {
    const request = createRequest("https://marry.fun/api/auth/web3/svm/verify", {
      origin: "https://www.marry.fun",
      host: "marry.fun",
    });

    const normalized = ensureOriginHeader(request, "marry.fun");
    expect(normalized.headers.get("origin")).toBe("https://www.marry.fun");
  });
});
