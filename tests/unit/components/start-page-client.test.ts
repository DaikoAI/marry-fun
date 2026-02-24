import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { StartPageClient } from "@/app/[locale]/start/start-page-client";

function getHaptic() {
  return { triggerHaptic: vi.fn() };
}

function getTranslator() {
  return (key: string) => key;
}

function getLocale() {
  return "ja";
}

function getRouter() {
  return { prefetch: vi.fn(), push: vi.fn() };
}

function getSession() {
  return {
    data: null,
    refetch: vi.fn(),
  };
}

vi.mock("next/image", () => ({
  default: ({ priority: _priority, ...props }: Record<string, unknown>) => React.createElement("img", props),
}));

vi.mock("use-haptic", () => ({
  useHaptic: getHaptic,
}));

vi.mock("next-intl", () => ({
  useTranslations: getTranslator,
  useLocale: getLocale,
}));

vi.mock("@/components/auth/solana-auth-panel", () => ({
  SolanaAuthPanel: () => React.createElement("div", { "data-testid": "solana-auth-panel" }),
}));

vi.mock("@/components/background", () => ({
  Background: () => React.createElement("div", { "data-testid": "background" }),
}));

vi.mock("@/components/prologue-overlay", () => ({
  PrologueOverlay: () => React.createElement("div", { "data-testid": "prologue-overlay" }),
}));

vi.mock("@/components/bgm-controller", () => ({
  BgmController: ({ className }: { className?: string }) =>
    React.createElement("div", { "data-testid": "bgm-controller", className }),
}));

vi.mock("@/i18n/navigation", () => ({
  useRouter: getRouter,
  Link: ({ children, ...props }: Record<string, unknown>) =>
    React.createElement("a", props, children as React.ReactNode),
}));

vi.mock("@/i18n/routing", () => ({
  routing: {
    locales: ["en", "ja"],
  },
}));

vi.mock("@/lib/auth/auth-client", () => ({
  authClient: {
    useSession: getSession,
    updateUser: vi.fn(),
  },
}));

describe("StartPageClient", () => {
  it("トップページ右上にBGMトグルを表示する", () => {
    const html = renderToStaticMarkup(React.createElement(StartPageClient));

    expect(html).toContain('data-testid="bgm-controller"');
    expect(html).toContain('class="h-11 w-11"');
    expect(html).toContain("absolute top-[max(env(safe-area-inset-top),1.5rem)]");
    expect(html).toContain("right-[max(env(safe-area-inset-right),1.5rem)]");
  });

  it("Solana auth panel を常に画面下に配置する", () => {
    const html = renderToStaticMarkup(React.createElement(StartPageClient));

    expect(html).toContain(
      'class="w-full mt-auto pb-[max(env(safe-area-inset-bottom),1.5rem)]"><div data-testid="solana-auth-panel"></div>',
    );
  });
});
