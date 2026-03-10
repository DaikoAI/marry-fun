import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { FooterLinks } from "@/components/footer-links";

vi.mock("@/components/help-modal", () => ({
  HelpModal: () => React.createElement("div", { "data-testid": "help-modal" }),
}));

describe("FooterLinks", () => {
  it("X リンクは公式アカウントを指す", () => {
    const html = renderToStaticMarkup(React.createElement(FooterLinks));

    expect(html).toContain('href="https://x.com/Marrydotfun"');
  });

  it("pump.funはLPでは表示しない", () => {
    const html = renderToStaticMarkup(React.createElement(FooterLinks));

    expect(html).not.toContain("pump.fun");
  });

  it("ゲームルールを開くDocsボタンを描画する", () => {
    const html = renderToStaticMarkup(React.createElement(FooterLinks));

    expect(html).toContain('aria-label="Game Rules"');
    expect(html).toContain("<button");
  });
});
