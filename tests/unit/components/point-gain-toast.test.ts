import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PointGainToast } from "@/components/point-gain-toast";

const mockState = {
  lastPointsEarned: null as number | null,
  pointGainEventId: 0,
  clearLastPoints: vi.fn(),
};

vi.mock("@/store/game-store", () => ({
  useGameStore: vi.fn((selector: (state: typeof mockState) => unknown) => selector(mockState)),
}));

describe("PointGainToast", () => {
  beforeEach(() => {
    mockState.lastPointsEarned = null;
    mockState.pointGainEventId = 0;
    mockState.clearLastPoints.mockClear();
  });

  it("加算時に画面上部中央へ +N を表示する", () => {
    mockState.lastPointsEarned = 8;
    mockState.pointGainEventId = 1;

    const html = renderToStaticMarkup(React.createElement(PointGainToast));

    expect(html).toContain("+8");
    expect(html).toContain("left-1/2");
    expect(html).toContain("-translate-x-1/2");
    expect(html).toContain("safe-area-inset-top");
    expect(html).toContain("text-[#22c55e]");
  });

  it("0以下の加算値は表示しない", () => {
    mockState.lastPointsEarned = 0;
    mockState.pointGainEventId = 1;

    const html = renderToStaticMarkup(React.createElement(PointGainToast));

    expect(html).toBe("");
  });
});
