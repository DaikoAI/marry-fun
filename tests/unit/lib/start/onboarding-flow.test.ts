import { describe, expect, it } from "vitest";

import { getStartOnboardingPhase, getStartOnboardingStep } from "@/lib/start/onboarding-flow";

describe("getStartOnboardingPhase", () => {
  it("wallet 未認証は connect フェーズ", () => {
    expect(
      getStartOnboardingPhase({
        isWalletAuthenticated: false,
        isXLinked: false,
        username: null,
        profileImage: null,
      }),
    ).toBe("connect");
  });

  it("wallet 認証済みでも X 未連携なら connect フェーズ", () => {
    expect(
      getStartOnboardingPhase({
        isWalletAuthenticated: true,
        isXLinked: false,
        username: "alice",
        profileImage: null,
      }),
    ).toBe("connect");
  });

  it("wallet と X が完了していて username 未設定なら username フェーズ", () => {
    expect(
      getStartOnboardingPhase({
        isWalletAuthenticated: true,
        isXLinked: true,
        username: " ",
        profileImage: null,
      }),
    ).toBe("username");
  });

  it("username 済みで profile image 未設定なら profile フェーズ", () => {
    expect(
      getStartOnboardingPhase({
        isWalletAuthenticated: true,
        isXLinked: true,
        username: "alice",
        profileImage: null,
      }),
    ).toBe("profile");
  });

  it("全要件が揃っていれば ready フェーズ", () => {
    expect(
      getStartOnboardingPhase({
        isWalletAuthenticated: true,
        isXLinked: true,
        username: "alice",
        profileImage: "https://cdn.example.com/avatar.webp",
      }),
    ).toBe("ready");
  });
});

describe("getStartOnboardingStep", () => {
  it("wallet または X が未連携なら wallet ステップ", () => {
    expect(
      getStartOnboardingStep({
        isWalletAuthenticated: true,
        isXLinked: false,
        requiresUsername: false,
      }),
    ).toBe("wallet");
  });

  it("wallet と X が連携済みで username 未設定なら name ステップ", () => {
    expect(
      getStartOnboardingStep({
        isWalletAuthenticated: true,
        isXLinked: true,
        requiresUsername: true,
      }),
    ).toBe("name");
  });
});
