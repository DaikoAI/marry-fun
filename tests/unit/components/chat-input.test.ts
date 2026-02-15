import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { ChatInput } from "@/components/chat-input";

const mockState = {
  isGirlTyping: false,
  hasEarnedAnyPoint: false,
  hasSeenGoalPopup: false,
  remainingChats: 20,
  isGameOver: false,
};

vi.mock("next-intl", () => ({
  useLocale: vi.fn(() => "ja"),
  useTranslations: vi.fn(() => (key: string) => key),
}));

vi.mock("use-haptic", () => ({
  useHaptic: vi.fn(() => ({ triggerHaptic: vi.fn() })),
}));

vi.mock("@/store/game-store", () => ({
  useGameStore: Object.assign(
    vi.fn((selector: (state: typeof mockState) => unknown) => selector(mockState)),
    { getState: vi.fn(() => mockState) },
  ),
}));

describe("ChatInput", () => {
  it("入力フォーム下部は pb-safe ユーティリティで safe area を調整する", () => {
    const html = renderToStaticMarkup(React.createElement(ChatInput));

    expect(html).toContain("pb-safe");
    expect(html).not.toContain("safe-area-inset-bottom");
  });
});
