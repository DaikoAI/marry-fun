import { describe, expect, it } from "vitest";
import { NgWord } from "@/domain/values/ng-word";

describe("NgWord", () => {
  it("メッセージにNGワードが含まれる場合trueを返す", () => {
    const ng = new NgWord("嫌い");
    expect(ng.isContainedIn("あなたが嫌いです")).toBe(true);
  });

  it("メッセージにNGワードが含まれない場合falseを返す", () => {
    const ng = new NgWord("嫌い");
    expect(ng.isContainedIn("あなたが好きです")).toBe(false);
  });

  it("大文字小文字を無視してマッチする", () => {
    const ng = new NgWord("boring");
    expect(ng.isContainedIn("You are BORING")).toBe(true);
  });

  it("空文字はエラー", () => {
    expect(() => new NgWord("")).toThrow("NG word must not be empty");
  });

  it("空白のみはエラー", () => {
    expect(() => new NgWord("   ")).toThrow("NG word must not be empty");
  });
});
