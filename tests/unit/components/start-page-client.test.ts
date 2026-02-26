import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

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

const getSessionMock = vi.fn();
const getStartOnboardingPhaseMock = vi.fn();

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
    useSession: getSessionMock,
    updateUser: vi.fn(),
  },
}));

vi.mock("@/lib/start/onboarding-flow", () => ({
  getStartOnboardingPhase: getStartOnboardingPhaseMock,
}));

async function renderStartPageClient(): Promise<string> {
  const { StartPageClient } = await import("@/app/[locale]/start/start-page-client");
  return renderToStaticMarkup(React.createElement(StartPageClient));
}

describe("StartPageClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSessionMock.mockReturnValue({
      data: null,
      refetch: vi.fn(),
    });
    getStartOnboardingPhaseMock.mockReturnValue("connect");
  });

  it("トップページ右上にBGMトグルを表示する", async () => {
    const html = await renderStartPageClient();

    expect(html).toContain('data-testid="bgm-controller"');
    expect(html).toContain('class="h-8 w-8"');
    expect(html).toContain("absolute top-[max(env(safe-area-inset-top),1.5rem)]");
    expect(html).toContain("right-[max(env(safe-area-inset-right),1.5rem)]");
  });

  it("Solana auth panel を常に画面下に配置する", async () => {
    const html = await renderStartPageClient();

    expect(html).toContain(
      'class="mt-auto w-full pb-[max(env(safe-area-inset-bottom),1.5rem)]"><div data-testid="solana-auth-panel"></div>',
    );
  });

  it("プロフィール画像生成後はトップページのreadyフェーズでも画像を表示する", async () => {
    getStartOnboardingPhaseMock.mockReturnValue("ready");
    getSessionMock.mockReturnValue({
      data: {
        session: { id: "s1" },
        user: {
          name: "alice",
          image: "https://cdn.example.com/profile-image/u1/2026-02-26/a.png",
        },
      },
      refetch: vi.fn(),
    });

    const html = await renderStartPageClient();

    expect(html).toContain('src="https://cdn.example.com/profile-image/u1/2026-02-26/a.png"');
    expect(html).toContain('alt="profilePreviewAlt"');
  });
});
