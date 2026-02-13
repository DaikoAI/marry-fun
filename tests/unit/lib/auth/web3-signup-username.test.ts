import { describe, expect, it } from "vitest";

import { resolveNewWeb3UserName, resolveWeb3UserNameForCreation } from "@/lib/auth/web3-signup-username";

describe("resolveNewWeb3UserName", () => {
  it("新規 SVM サインイン時に username を trim して返す", () => {
    expect(resolveNewWeb3UserName("/web3/svm/verify", "  テストユーザー  ")).toBe("テストユーザー");
  });

  it("新規 SVM サインイン時に username が空なら null を返す", () => {
    expect(resolveNewWeb3UserName("/web3/svm/verify", "   ")).toBeNull();
  });

  it("新規 SVM サインイン時に username ヘッダー未指定でも null を返す", () => {
    expect(resolveNewWeb3UserName("/web3/svm/verify", null)).toBeNull();
  });

  it("新規 SVM サインイン時に username が 20 文字超過なら例外を投げる", () => {
    expect(() => resolveNewWeb3UserName("/web3/svm/verify", "123456789012345678901")).toThrow(
      "Username must be between 1 and 20 characters.",
    );
  });

  it("web3 以外の経路では username ヘッダーが無くても null を返す", () => {
    expect(resolveNewWeb3UserName("/sign-up/email", null)).toBeNull();
  });
});

describe("resolveWeb3UserNameForCreation", () => {
  it("web3 verify 経路で username 未指定なら name を null にする", () => {
    expect(resolveWeb3UserNameForCreation("/web3/svm/verify", null)).toEqual({
      isWeb3VerifyPath: true,
      username: null,
    });
  });

  it("web3 以外の経路では上書きしない", () => {
    expect(resolveWeb3UserNameForCreation("/sign-up/email", null)).toEqual({
      isWeb3VerifyPath: false,
      username: null,
    });
  });
});
