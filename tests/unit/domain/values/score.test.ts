import { describe, expect, it } from "vitest";
import { Score } from "@/domain/values/score";

describe("Score", () => {
  it("rawスコアから1.2倍のadjustedスコアを計算する", () => {
    const score = Score.fromRaw(5);
    expect(score.raw).toBe(5);
    expect(score.adjusted).toBe(6); // 5 * 1.2 = 6
  });

  it("adjusted値はMath.roundで丸められる", () => {
    const score = Score.fromRaw(7);
    expect(score.adjusted).toBe(8); // 7 * 1.2 = 8.4 → 8
  });

  it("最小値1で正しく計算される", () => {
    const score = Score.fromRaw(1);
    expect(score.adjusted).toBe(1); // 1 * 1.2 = 1.2 → 1
  });

  it("最大値10で正しく計算される", () => {
    const score = Score.fromRaw(10);
    expect(score.adjusted).toBe(12); // 10 * 1.2 = 12
  });

  it("範囲外（0以下）はエラー", () => {
    expect(() => Score.fromRaw(0)).toThrow(RangeError);
    expect(() => Score.fromRaw(-1)).toThrow(RangeError);
  });

  it("範囲外（11以上）はエラー", () => {
    expect(() => Score.fromRaw(11)).toThrow(RangeError);
  });

  it("非整数はエラー", () => {
    expect(() => Score.fromRaw(3.5)).toThrow(RangeError);
  });
});
