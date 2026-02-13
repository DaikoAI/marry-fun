import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ChatHeader } from "@/components/chat-header";

const mockState = {
  points: 1234,
  tokenBonus: 1.5,
};

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    if (key === "pts") return "Points";
    return key;
  },
}));

vi.mock("@/store/game-store", () => ({
  useGameStore: (selector: (state: typeof mockState) => unknown) => selector(mockState),
}));

vi.mock("@/components/bgm-controller", () => ({
  BgmController: () => React.createElement("div", { "data-testid": "bgm-controller" }),
}));

vi.mock("@/components/leaderboard-modal", () => ({
  LeaderboardModal: () => null,
}));

vi.mock("@/components/icons/pump-fun-icon", () => ({
  PumpFunIcon: (props: { className?: string }) => React.createElement("svg", props),
}));

describe("ChatHeader", () => {
  beforeEach(() => {
    mockState.points = 1234;
    mockState.tokenBonus = 1.5;
  });

  it("ボーナス表示はポイント数値に重ならない配置で描画される", () => {
    const html = renderToStaticMarkup(React.createElement(ChatHeader));

    expect(html).toContain('aria-label="Bonus 1.5x"');
    expect(html).toContain("1.5x");
    expect(html).not.toContain("absolute -top-1 -right-1");
  });

  it("soonバッジに$MARRYが表示される", () => {
    const html = renderToStaticMarkup(React.createElement(ChatHeader));

    expect(html).toContain("$MARRY");
  });

  it("ヘッダーに獲得ポイントの浮遊演出を持たない", () => {
    const html = renderToStaticMarkup(React.createElement(ChatHeader));

    expect(html).not.toContain("pointsFloat");
    expect(html).not.toContain("+12");
  });
});
