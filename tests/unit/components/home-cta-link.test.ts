import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { HomeCtaLink } from "@/components/home-cta-link";

const { mockUseHaptic } = vi.hoisted(() => ({
  mockUseHaptic: vi.fn(() => ({
    triggerHaptic: vi.fn(),
  })),
}));

vi.mock("use-haptic", () => ({
  useHaptic: mockUseHaptic,
}));

vi.mock("@/i18n/navigation", () => ({
  Link: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) =>
    React.createElement("a", { href, ...props }, children),
}));

describe("HomeCtaLink", () => {
  it("LP公開中はcoming soon表示の非活性ボタンを描画する", () => {
    const html = renderToStaticMarkup(React.createElement(HomeCtaLink, { label: "coming soon...", disabled: true }));

    expect(html).toContain("coming soon...");
    expect(html).toContain('aria-disabled="true"');
    expect(html).not.toContain('href="/start"');
  });
});
