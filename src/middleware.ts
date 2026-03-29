import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";

import { getPrelaunchLocale, isPrelaunchAllowedPathname } from "./lib/prelaunch";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  if (!isPrelaunchAllowedPathname(request.nextUrl.pathname)) {
    const locale = getPrelaunchLocale(request.nextUrl.pathname);
    return NextResponse.redirect(new URL(`/${locale}`, request.url));
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!api|trpc|_next|_vercel|.*\\..*).*)"],
};
