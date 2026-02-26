"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { createMessage } from "better-auth-web3/util";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";

import { authClient } from "@/lib/auth/auth-client";

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  bytes.forEach(value => {
    binary += String.fromCharCode(value);
  });
  return btoa(binary);
}

function createSignInMessage(nonce: string): string {
  return createMessage(window.location.hostname, nonce, "Sign in to marry.fun.");
}

interface SolanaAuthPanelProps {
  /** When true (e.g. onboarding), hide Sign Out after auth */
  variant?: "onboarding" | "default";
}

export function formatConnectedWalletButtonLabel(walletAddress: string): string {
  return `${walletAddress.slice(0, 4)}..${walletAddress.slice(-4)} ✅`;
}

export function formatLinkedXButtonLabel(username: string | null | undefined, connectedLabel: string): string {
  if (username && username.length > 0) {
    return `@${username} ✅`;
  }
  return `${connectedLabel} ✅`;
}

interface OnboardingHeadlineCopy {
  title: string;
  subtitle: string | null;
}

export function getOnboardingHeadlineCopy(isXLinked: boolean): OnboardingHeadlineCopy {
  if (isXLinked) {
    return {
      title: "you got 300points!",
      subtitle: "stay tune...",
    };
  }

  return {
    title: "Register to earn points",
    subtitle: null,
  };
}

function readAuthErrorMessage(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  if ("message" in payload && typeof payload.message === "string" && payload.message.length > 0) {
    return payload.message;
  }

  if (
    "error" in payload &&
    payload.error &&
    typeof payload.error === "object" &&
    "message" in payload.error &&
    typeof payload.error.message === "string" &&
    payload.error.message.length > 0
  ) {
    return payload.error.message;
  }

  return null;
}

export function isWalletSignMessageUserRejectedError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const errorName = "name" in error && typeof error.name === "string" ? error.name : "";
  const errorMessage = "message" in error && typeof error.message === "string" ? error.message : "";
  const errorCode = "code" in error ? error.code : undefined;

  return (
    errorName === "WalletSignMessageError" &&
    (errorMessage.toLowerCase().includes("user rejected") || errorCode === 4001)
  );
}

interface XLinkStatus {
  linked: boolean;
  providerAccountId?: string;
  username?: string | null;
  profileImageUrl?: string | null;
}

interface ShouldAutoSignInInput {
  connected: boolean;
  hasPublicKey: boolean;
  hasSignMessage: boolean;
  isAuthenticated: boolean;
  isSigningIn: boolean;
  isSessionPending: boolean;
}

function XBrandIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current">
      <path d="M18.244 2h3.2l-6.99 7.99L22.75 22h-6.5l-5.09-6.6L5.38 22h-3.2l7.48-8.56L1.5 2h6.66l4.6 6.01L18.244 2Zm-1.14 18h1.77L7.2 3.89H5.3L17.104 20Z" />
    </svg>
  );
}

function removeXText(label: string): string {
  const normalized = label.replace(/[Xx]/g, "").replace(/\s+/g, " ").trim();
  return normalized.length > 0 ? normalized : label;
}

function readXLinkStatus(payload: unknown): XLinkStatus | null {
  if (!payload || typeof payload !== "object" || !("linked" in payload) || typeof payload.linked !== "boolean") {
    return null;
  }

  const response: XLinkStatus = { linked: payload.linked };
  if ("providerAccountId" in payload && typeof payload.providerAccountId === "string") {
    response.providerAccountId = payload.providerAccountId;
  }
  if ("username" in payload && (typeof payload.username === "string" || payload.username === null)) {
    response.username = payload.username;
  }
  if (
    "profileImageUrl" in payload &&
    (typeof payload.profileImageUrl === "string" || payload.profileImageUrl === null)
  ) {
    response.profileImageUrl = payload.profileImageUrl;
  }
  return response;
}

export function shouldAutoSignIn(input: ShouldAutoSignInInput): boolean {
  return (
    input.connected &&
    input.hasPublicKey &&
    input.hasSignMessage &&
    !input.isAuthenticated &&
    !input.isSigningIn &&
    !input.isSessionPending
  );
}

export function SolanaAuthPanel({ variant = "default" }: SolanaAuthPanelProps) {
  const { connected, connecting, publicKey, signMessage } = useWallet();
  const { setVisible } = useWalletModal();
  const session = authClient.useSession();
  const t = useTranslations("start");
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isLinkingX, setIsLinkingX] = useState(false);
  const [isCheckingXLink, setIsCheckingXLink] = useState(false);
  const [isXLinked, setIsXLinked] = useState(false);
  const [xUsername, setXUsername] = useState<string | null>(null);
  const [, setXProfileImageUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const hasTriggeredSignInRef = useRef(false);

  const isAuthenticated = Boolean(session.data?.session);

  const refreshXLinkStatus = useCallback(async () => {
    if (!isAuthenticated) {
      setIsXLinked(false);
      setXUsername(null);
      setXProfileImageUrl(null);
      return;
    }

    setIsCheckingXLink(true);

    try {
      const response = await fetch("/api/auth/x/link-status", {
        method: "GET",
        cache: "no-store",
      });
      const payload: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        setIsXLinked(false);
        setXUsername(null);
        setXProfileImageUrl(null);
        return;
      }

      const status = readXLinkStatus(payload);
      setIsXLinked(Boolean(status?.linked));
      setXUsername(status?.username ?? null);
      setXProfileImageUrl(status?.profileImageUrl ?? null);
    } catch {
      setIsXLinked(false);
      setXUsername(null);
      setXProfileImageUrl(null);
    } finally {
      setIsCheckingXLink(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    void refreshXLinkStatus();
  }, [refreshXLinkStatus]);

  const handleSignIn = useCallback(async () => {
    if (!connected || !publicKey || !signMessage || isSigningIn) {
      return;
    }

    setIsSigningIn(true);
    setErrorMessage(null);

    try {
      const walletAddress = publicKey.toBase58();

      const nonceResult = await authClient.web3.nonce({
        walletAddress,
        type: "svm",
        value: "mainnet-beta",
      });

      if (nonceResult.error || !nonceResult.data.nonce) {
        throw new Error(nonceResult.error?.message ?? "Failed to get nonce");
      }

      const message = createSignInMessage(nonceResult.data.nonce);
      const signatureBytes = await signMessage(new TextEncoder().encode(message));
      const verifyResponse = await fetch("/api/auth/web3/svm/verify", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          message,
          signature: toBase64(signatureBytes),
          walletAddress,
          cluster: "mainnet-beta",
        }),
      });
      const verifyPayload: unknown = await verifyResponse.json().catch(() => null);

      if (!verifyResponse.ok) {
        const errorMessage = readAuthErrorMessage(verifyPayload);
        throw new Error(errorMessage ?? "SIWS verification failed");
      }

      await session.refetch();
      await refreshXLinkStatus();
    } catch (error) {
      if (isWalletSignMessageUserRejectedError(error)) {
        setErrorMessage(null);
        return;
      }

      const message = error instanceof Error ? error.message : "Failed to sign in with wallet";
      setErrorMessage(message);
    } finally {
      setIsSigningIn(false);
    }
  }, [connected, publicKey, refreshXLinkStatus, session, signMessage, isSigningIn]);

  // Auto-trigger sign-in when wallet connects (connect → sign flow)
  useEffect(() => {
    if (
      shouldAutoSignIn({
        connected,
        hasPublicKey: Boolean(publicKey),
        hasSignMessage: Boolean(signMessage),
        isAuthenticated,
        isSigningIn,
        isSessionPending: session.isPending,
      })
    ) {
      if (!hasTriggeredSignInRef.current) {
        hasTriggeredSignInRef.current = true;
        void handleSignIn();
      }
    } else if (!connected) {
      hasTriggeredSignInRef.current = false;
    }
  }, [connected, publicKey, signMessage, isAuthenticated, isSigningIn, handleSignIn, session.isPending]);

  const handleLinkX = async () => {
    if (!isAuthenticated || isXLinked || isLinkingX || isCheckingXLink) {
      return;
    }

    setIsLinkingX(true);
    setErrorMessage(null);

    try {
      const result = await authClient.linkSocial({
        provider: "twitter",
        callbackURL: window.location.href,
      });

      if (result.error) {
        throw new Error(result.error.message ?? "Failed to link X account");
      }

      await refreshXLinkStatus();
    } catch (error) {
      const message = error instanceof Error ? error.message : t("xLinkError");
      setErrorMessage(message);
    } finally {
      setIsLinkingX(false);
    }
  };

  const handleSignOut = async () => {
    hasTriggeredSignInRef.current = false;
    await authClient.signOut();
    await session.refetch();
    setIsXLinked(false);
    setXUsername(null);
    setXProfileImageUrl(null);
  };

  const handleConnectClick = () => {
    if (isAuthenticated) return;
    if (connected && publicKey && signMessage && !isSigningIn) {
      void handleSignIn();
    } else {
      setVisible(true);
    }
  };

  const shouldDisableXButton = !isAuthenticated || isXLinked || isLinkingX || isCheckingXLink || session.isPending;
  const xButtonText =
    isLinkingX ? t("connectingX")
    : isXLinked ? formatLinkedXButtonLabel(xUsername, t("connectedX"))
    : removeXText(t("connectX"));
  const onboardingHeadlineCopy = getOnboardingHeadlineCopy(isXLinked);
  const walletButtonText =
    connecting ? t("connecting")
    : isSigningIn ? t("signing")
    : isAuthenticated && publicKey ? formatConnectedWalletButtonLabel(publicKey.toBase58())
    : t("connectWallet");

  return (
    <div className="solana-auth-panel mx-auto w-full max-w-[300px] rounded-xl border border-white/45 bg-black/35 p-3 shadow-[0_12px_32px_rgba(0,0,0,0.35)] backdrop-blur-md">
      <div className="flex flex-col items-center gap-2">
        {variant === "onboarding" && (
          <p className="pb-0.5 text-center text-xs font-semibold tracking-[0.08em] text-white">
            <span className="block">{onboardingHeadlineCopy.title}</span>
            {onboardingHeadlineCopy.subtitle && (
              <span className="block text-[11px] font-medium tracking-[0.06em] text-white/90">
                {onboardingHeadlineCopy.subtitle}
              </span>
            )}
          </p>
        )}
        <button
          type="button"
          disabled={connecting || isSigningIn || session.isPending}
          onClick={handleConnectClick}
          className="h-9 w-full rounded-lg border-2 border-pink-200/50 bg-black/30 px-3 py-2 text-xs font-semibold text-pink-100 shadow-[0_0_20px_rgba(255,255,255,0.08)] backdrop-blur-md transition-all hover:scale-[1.02] hover:border-pink-200/60 hover:bg-pink-200/25 focus-visible:ring-2 focus-visible:ring-pink-200/70 focus-visible:outline-none active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {walletButtonText}
        </button>
        <button
          type="button"
          disabled={shouldDisableXButton}
          onClick={() => {
            void handleLinkX();
          }}
          className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-sky-200/60 bg-sky-400/35 px-3 py-1.5 text-xs font-semibold text-sky-50 transition hover:bg-sky-400/45 focus-visible:ring-2 focus-visible:ring-sky-200/80 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        >
          <XBrandIcon />
          <span>{xButtonText}</span>
        </button>
        {variant !== "onboarding" && isAuthenticated && (
          <button
            type="button"
            onClick={() => {
              void handleSignOut();
            }}
            className="rounded-lg border border-white/50 bg-black/35 px-3 py-1.5 text-xs font-semibold text-white/95 transition hover:bg-black/45 focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:outline-none"
          >
            Sign Out
          </button>
        )}
        {errorMessage && (
          <p className="text-xs text-red-200" role="status" aria-live="polite">
            {errorMessage}
          </p>
        )}
      </div>
    </div>
  );
}
