import { routing } from "@/i18n/routing";

export function isPrelaunchAllowedPathname(pathname: string) {
  const normalizedPathname = pathname !== "/" && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;

  return normalizedPathname === "/" || routing.locales.some(locale => normalizedPathname === `/${locale}`);
}

export function getPrelaunchLocale(pathname: string) {
  return (
    routing.locales.find(locale => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)) ??
    routing.defaultLocale
  );
}
