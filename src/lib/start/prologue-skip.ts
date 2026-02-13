export type StartPagePhase = "form" | "prologue";

interface PrologueSkipInput {
  phase: StartPagePhase;
  hasInitResponse: boolean;
}

export function shouldShowPrologueSkip({ phase, hasInitResponse }: PrologueSkipInput): boolean {
  return phase === "prologue" && hasInitResponse;
}
