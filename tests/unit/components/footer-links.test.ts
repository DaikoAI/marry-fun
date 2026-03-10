import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { FooterLinks } from "@/components/footer-links";

vi.mock("@/components/icons/pump-fun-icon", () => ({
  PumpFunIcon: (props: { className?: string }) => React.createElement("svg", props),
}));

vi.mock("@/components/help-modal", () => ({
  HelpModal: () => React.createElement("div", { "data-testid": "help-modal" }),
}));

describe("FooterLinks", () => {
  it("X リンクは公式アカウントを指す", () => {
    const html = renderToStaticMarkup(React.createElement(FooterLinks));

    expect(html).toContain('href="https://x.com/Marrydotfun"');
  });

  it("pump.funは非活性表示になる", () => {
    const html = renderToStaticMarkup(React.createElement(FooterLinks));

    expect(html).toContain('aria-label="pump.fun (coming soon)"');
    expect(html).toContain('aria-disabled="true"');
  });

  it("ゲームルールを開くDocsボタンを描画する", () => {
    const html = renderToStaticMarkup(React.createElement(FooterLinks));

    expect(html).toContain('aria-label="Game Rules"');
    expect(html).toContain("<button");
  });
});
