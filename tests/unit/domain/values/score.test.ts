import { describe, expect, it } from "vitest";

import { Score } from "@/domain/values/score";

describe("Score", () => {
  it("raw score から最終表示pointを計算する", () => {
    expect(Score.fromRaw(5).adjusted).toBe(9);
    expect(Score.fromRaw(2).adjusted).toBe(3);
    expect(Score.fromRaw(1).adjusted).toBe(2);
    expect(Score.fromRaw(10).adjusted).toBe(18);
  });
});
