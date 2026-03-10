import { describe, expect, it } from "vitest";

import { isPrelaunchAllowedPathname } from "@/lib/prelaunch";

describe("isPrelaunchAllowedPathname", () => {
  it("LP のトップパスだけを許可する", () => {
    expect(isPrelaunchAllowedPathname("/")).toBe(true);
    expect(isPrelaunchAllowedPathname("/ja")).toBe(true);
    expect(isPrelaunchAllowedPathname("/en")).toBe(true);
  });

  it("LP以外の画面パスは拒否する", () => {
    expect(isPrelaunchAllowedPathname("/ja/start")).toBe(false);
    expect(isPrelaunchAllowedPathname("/en/chat")).toBe(false);
    expect(isPrelaunchAllowedPathname("/start")).toBe(false);
  });
});
