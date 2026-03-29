import { describe, expect, it } from "vitest";

import { initialStartGameFlowState, isGameOverBlockedError, startGameFlowReducer } from "@/lib/start/start-game-flow";

describe("startGameFlowReducer", () => {
  it("BEGIN_SUBMISSION で prologue 開始状態になる", () => {
    expect(startGameFlowReducer(initialStartGameFlowState, { type: "BEGIN_SUBMISSION" })).toEqual({
      isSubmitting: true,
      phase: "prologue",
      hasInitResponse: false,
      initError: false,
      gameOverBlocked: false,
    });
  });

  it("INIT_READY でスキップ可能状態になる", () => {
    const started = startGameFlowReducer(initialStartGameFlowState, { type: "BEGIN_SUBMISSION" });

    expect(startGameFlowReducer(started, { type: "INIT_READY" })).toEqual({
      ...started,
      hasInitResponse: true,
    });
  });

  it("INIT_BLOCKED でフォームへ戻し再開始不可にする", () => {
    const started = startGameFlowReducer(initialStartGameFlowState, { type: "BEGIN_SUBMISSION" });

    expect(startGameFlowReducer(started, { type: "INIT_BLOCKED" })).toEqual({
      isSubmitting: false,
      phase: "form",
      hasInitResponse: false,
      initError: false,
      gameOverBlocked: true,
    });
  });

  it("PROLOGUE_FAILED でエラー表示状態に戻す", () => {
    const ready = startGameFlowReducer(startGameFlowReducer(initialStartGameFlowState, { type: "BEGIN_SUBMISSION" }), {
      type: "INIT_READY",
    });

    expect(startGameFlowReducer(ready, { type: "PROLOGUE_FAILED" })).toEqual({
      isSubmitting: false,
      phase: "form",
      hasInitResponse: false,
      initError: true,
      gameOverBlocked: false,
    });
  });
});

describe("isGameOverBlockedError", () => {
  it("GAME_OVER_BLOCKED を識別する", () => {
    expect(isGameOverBlockedError({ code: "GAME_OVER_BLOCKED" })).toBe(true);
    expect(isGameOverBlockedError({ code: "OTHER" })).toBe(false);
    expect(isGameOverBlockedError(new Error("boom"))).toBe(false);
  });
});
