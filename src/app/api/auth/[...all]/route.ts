import { toNextJsHandler } from "better-auth/next-js";

import { getAuth, getAuthBaseUrl } from "@/lib/auth/auth";
import { ensureOriginHeader, resolveWeb3RequestDomain } from "@/lib/auth/web3-domain";

// Note: export const runtime = "edge" is not supported by @opennextjs/cloudflare
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await getAuth();
  const handler = toNextJsHandler(auth);
  return handler.GET(request);
}

export async function POST(request: Request) {
  const auth = await getAuth(request);
  const handler = toNextJsHandler(auth);
  const web3Domain = resolveWeb3RequestDomain(request, getAuthBaseUrl());
  const normalizedRequest = ensureOriginHeader(request, web3Domain);
  return handler.POST(normalizedRequest);
}
