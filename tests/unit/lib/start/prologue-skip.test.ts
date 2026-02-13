import { describe, expect, it } from "vitest";

import { shouldShowPrologueSkip } from "@/lib/start/prologue-skip";

describe("shouldShowPrologueSkip", () => {
  it("prologue中かつ初期APIレスポンス受信後は true", () => {
    expect(
      shouldShowPrologueSkip({
        phase: "prologue",
        hasInitResponse: true,
      }),
    ).toBe(true);
  });

  it("prologue中でも初期APIレスポンス未受信なら false", () => {
    expect(
      shouldShowPrologueSkip({
        phase: "prologue",
        hasInitResponse: false,
      }),
    ).toBe(false);
  });

  it("formフェーズでは常に false", () => {
    expect(
      shouldShowPrologueSkip({
        phase: "form",
        hasInitResponse: true,
      }),
    ).toBe(false);
  });
});
