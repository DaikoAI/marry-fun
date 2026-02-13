import { describe, expect, it } from "vitest";

import { getStartOnboardingStep } from "@/lib/start/onboarding-flow";

describe("getStartOnboardingStep", () => {
  it("初期状態は wallet 接続ステップ", () => {
    expect(
      getStartOnboardingStep({
        isWalletAuthenticated: false,
        requiresUsername: false,
      }),
    ).toBe("wallet");
  });

  it("未認証時は requiresUsername=true でも先に wallet 接続ステップ", () => {
    expect(
      getStartOnboardingStep({
        isWalletAuthenticated: false,
        requiresUsername: true,
      }),
    ).toBe("wallet");
  });

  it("wallet 認証済みかつ username 未設定なら name 入力ステップ", () => {
    expect(
      getStartOnboardingStep({
        isWalletAuthenticated: true,
        requiresUsername: true,
      }),
    ).toBe("name");
  });

  it("wallet 認証済みかつ username 設定済みなら start ステップ", () => {
    expect(
      getStartOnboardingStep({
        isWalletAuthenticated: true,
        requiresUsername: false,
      }),
    ).toBe("start");
  });
});
