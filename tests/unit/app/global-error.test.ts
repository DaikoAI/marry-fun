import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

describe("Global error boundary", () => {
  it("renders a root fallback document without throwing", async () => {
    const mod = await import("@/app/global-error");
    const element = React.createElement(mod.default, {
      error: new Error("boom"),
      reset: () => {},
    });

    const html = renderToStaticMarkup(element);
    expect(html).toContain("<html");
    expect(html).toContain("<body");
  });

  it("renders a locale fallback document without throwing", async () => {
    const mod = await import("@/app/[locale]/global-error");
    const element = React.createElement(mod.default, {
      error: new Error("boom"),
      reset: () => {},
    });

    const html = renderToStaticMarkup(element);
    expect(html).toContain("<html");
    expect(html).toContain("<body");
  });
});
