import { beforeEach, describe, expect, it } from "vitest";

import { useGameStore } from "@/store/game-store";

describe("useGameStore", () => {
  beforeEach(() => {
    useGameStore.getState().resetGame();
  });

  it("addPoints は受け取ったpointをそのまま加算する（二重ボーナスしない）", () => {
    const before = useGameStore.getState();
    expect(before.points).toBe(0);

    useGameStore.getState().addPoints(9);

    const after = useGameStore.getState();
    expect(after.points).toBe(9);
    expect(after.lastPointsEarned).toBe(9);
    expect(after.jackpot).toBe(1);
  });

  it("setPoints は現在値ではなくDB残高で上書きする", () => {
    useGameStore.getState().addPoints(5);
    expect(useGameStore.getState().points).toBe(5);

    useGameStore.getState().setPoints(120);

    const after = useGameStore.getState();
    expect(after.points).toBe(120);
  });

  it("addPoints 後に hasEarnedAnyPoint が true になる", () => {
    expect(useGameStore.getState().hasEarnedAnyPoint).toBe(false);

    useGameStore.getState().addPoints(1);

    expect(useGameStore.getState().hasEarnedAnyPoint).toBe(true);
  });
});
