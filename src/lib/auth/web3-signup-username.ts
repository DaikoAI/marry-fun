import { APIError } from "better-auth/api";

const WEB3_SVM_VERIFY_PATH = "/web3/svm/verify";
const USERNAME_MIN_LENGTH = 1;
const USERNAME_MAX_LENGTH = 20;

interface Web3UserNameForCreation {
  isWeb3VerifyPath: boolean;
  username: string | null;
}

export function normalizeUsername(value: string | null | undefined): string | null {
  const normalized = value?.trim() ?? "";
  if (normalized.length === 0) {
    return null;
  }
  return normalized;
}

export function resolveWeb3UserNameForCreation(
  path: string | undefined,
  usernameHeader: string | null | undefined,
): Web3UserNameForCreation {
  const isWeb3VerifyPath = Boolean(path?.endsWith(WEB3_SVM_VERIFY_PATH));
  if (!isWeb3VerifyPath) {
    return {
      isWeb3VerifyPath: false,
      username: null,
    };
  }

  const username = normalizeUsername(usernameHeader);
  if (!username) {
    return {
      isWeb3VerifyPath: true,
      username: null,
    };
  }

  if (username.length < USERNAME_MIN_LENGTH || username.length > USERNAME_MAX_LENGTH) {
    throw new APIError("BAD_REQUEST", {
      message: "Username must be between 1 and 20 characters.",
      status: 400,
      code: "USERNAME_LENGTH_INVALID",
    });
  }

  return {
    isWeb3VerifyPath: true,
    username,
  };
}

export function resolveNewWeb3UserName(
  path: string | undefined,
  usernameHeader: string | null | undefined,
): string | null {
  return resolveWeb3UserNameForCreation(path, usernameHeader).username;
}
