import type { StartPagePhase } from "./prologue-skip";

export interface StartGameFlowState {
  isSubmitting: boolean;
  phase: StartPagePhase;
  hasInitResponse: boolean;
  initError: boolean;
  gameOverBlocked: boolean;
}

export const initialStartGameFlowState: StartGameFlowState = {
  isSubmitting: false,
  phase: "form",
  hasInitResponse: false,
  initError: false,
  gameOverBlocked: false,
};

export type StartGameFlowAction =
  | { type: "RESET" }
  | { type: "BEGIN_SUBMISSION" }
  | { type: "INIT_READY" }
  | { type: "INIT_BLOCKED" }
  | { type: "INIT_FAILED" }
  | { type: "PROLOGUE_FAILED" };

export function startGameFlowReducer(state: StartGameFlowState, action: StartGameFlowAction): StartGameFlowState {
  switch (action.type) {
    case "RESET":
      return initialStartGameFlowState;
    case "BEGIN_SUBMISSION":
      return {
        ...state,
        isSubmitting: true,
        phase: "prologue",
        hasInitResponse: false,
        initError: false,
      };
    case "INIT_READY":
      return {
        ...state,
        hasInitResponse: true,
      };
    case "INIT_BLOCKED":
      return {
        ...state,
        isSubmitting: false,
        phase: "form",
        gameOverBlocked: true,
      };
    case "INIT_FAILED":
      return {
        ...state,
        hasInitResponse: false,
      };
    case "PROLOGUE_FAILED":
      return {
        ...state,
        isSubmitting: false,
        phase: "form",
        hasInitResponse: false,
        initError: true,
      };
    default:
      return state;
  }
}

export function isGameOverBlockedError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "GAME_OVER_BLOCKED"
  );
}
