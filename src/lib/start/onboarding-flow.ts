export type StartOnboardingStep = "name" | "wallet" | "start";

interface GetStartOnboardingStepParams {
  isWalletAuthenticated: boolean;
  requiresUsername: boolean;
}

export function getStartOnboardingStep(params: GetStartOnboardingStepParams): StartOnboardingStep {
  const { isWalletAuthenticated, requiresUsername } = params;
  if (!isWalletAuthenticated) {
    return "wallet";
  }

  if (requiresUsername) {
    return "name";
  }

  return "start";
}
