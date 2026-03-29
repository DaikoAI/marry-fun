import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { Background } from "@/components/background";

vi.mock("next/image", () => ({
  default: ({ src, alt, className }: { src: string; alt: string; className?: string }) =>
    React.createElement("img", { src, alt, className }),
}));

describe("Background", () => {
  it("SP と PC で背景画像を出し分ける", () => {
    const html = renderToStaticMarkup(
      React.createElement(Background, {
        mobileSrc: "/bg/top_sp.png",
        desktopSrc: "/bg/top_pc.png",
        showSparkles: false,
      }),
    );

    expect(html).toContain("/bg/top_sp.png");
    expect(html).toContain("/bg/top_pc.png");
    expect(html).toContain("sm:hidden");
    expect(html).toContain("hidden sm:block");
  });
});
