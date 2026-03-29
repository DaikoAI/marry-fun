export type StartOnboardingPhase = "connect" | "username" | "profile" | "ready";
export type StartOnboardingStep = "name" | "wallet" | "start";

interface GetStartOnboardingPhaseParams {
  isWalletAuthenticated: boolean;
  isXLinked: boolean;
  username: string | null | undefined;
  profileImage: string | null | undefined;
}

interface GetStartOnboardingStepParams {
  isWalletAuthenticated: boolean;
  isXLinked: boolean;
  requiresUsername: boolean;
}

function isValidUsername(name: string | null | undefined): boolean {
  const trimmed = name?.trim() ?? "";
  return trimmed.length >= 1 && trimmed.length <= 20;
}

function hasProfileImage(image: string | null | undefined): boolean {
  if (!image) return false;
  try {
    const parsed = new URL(image);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

export function getStartOnboardingPhase(params: GetStartOnboardingPhaseParams): StartOnboardingPhase {
  if (!params.isWalletAuthenticated || !params.isXLinked) {
    return "connect";
  }

  if (!isValidUsername(params.username)) {
    return "username";
  }

  if (!hasProfileImage(params.profileImage)) {
    return "profile";
  }

  return "ready";
}

export function getStartOnboardingStep(params: GetStartOnboardingStepParams): StartOnboardingStep {
  const phase = getStartOnboardingPhase({
    isWalletAuthenticated: params.isWalletAuthenticated,
    isXLinked: params.isXLinked,
    username: params.requiresUsername ? "" : "ok",
    profileImage: params.requiresUsername ? null : "https://example.com/profile.webp",
  });

  switch (phase) {
    case "connect":
      return "wallet";
    case "username":
      return "name";
    case "profile":
    case "ready":
      return "start";
    default:
      return "wallet";
  }
}
