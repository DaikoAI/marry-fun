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

interface XLinkStatus {
  linked: boolean;
  providerAccountId?: string;
  username?: string | null;
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
  return response;
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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const hasTriggeredSignInRef = useRef(false);

  const isAuthenticated = Boolean(session.data?.session);

  const refreshXLinkStatus = useCallback(async () => {
    if (!isAuthenticated) {
      setIsXLinked(false);
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
        return;
      }

      const status = readXLinkStatus(payload);
      setIsXLinked(Boolean(status?.linked));
    } catch {
      setIsXLinked(false);
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
      const message = error instanceof Error ? error.message : "Failed to sign in with wallet";
      setErrorMessage(message);
    } finally {
      setIsSigningIn(false);
    }
  }, [connected, publicKey, refreshXLinkStatus, session, signMessage, isSigningIn]);

  // Auto-trigger sign-in when wallet connects (connect → sign flow)
  useEffect(() => {
    if (connected && publicKey && signMessage && !isAuthenticated && !isSigningIn) {
      if (!hasTriggeredSignInRef.current) {
        hasTriggeredSignInRef.current = true;
        void handleSignIn();
      }
    } else if (!connected) {
      hasTriggeredSignInRef.current = false;
    }
  }, [connected, publicKey, signMessage, isAuthenticated, isSigningIn, handleSignIn]);

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
  const xButtonLabel =
    isLinkingX ? t("connectingX")
    : isXLinked ? t("connectedX")
    : t("connectX");

  return (
    <div className="solana-auth-panel w-full rounded-2xl border border-white/30 bg-white/10 p-4 shadow-[0_12px_32px_rgba(0,0,0,0.25)] backdrop-blur-md">
      <div className="flex flex-col items-center gap-3">
        {!isAuthenticated ?
          <>
            <button
              type="button"
              disabled={connecting || isSigningIn || session.isPending}
              onClick={handleConnectClick}
              className="h-11 w-full rounded-xl border-2 border-pink-200/40 bg-white/10 px-4 py-2.5 text-sm font-semibold text-pink-100/90 shadow-[0_0_20px_rgba(255,255,255,0.06)] backdrop-blur-sm transition-all hover:scale-[1.02] hover:border-pink-200/60 hover:bg-pink-200/20 focus-visible:ring-2 focus-visible:ring-pink-200/70 focus-visible:outline-none active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {connecting ?
                t("connecting")
              : isSigningIn ?
                t("signing")
              : t("connectWallet")}
            </button>
          </>
        : <>
            <p className="text-xs text-white/75">
              {publicKey ? `${publicKey.toBase58().slice(0, 4)}...${publicKey.toBase58().slice(-4)}` : ""}
            </p>
          </>
        }
        <button
          type="button"
          disabled={shouldDisableXButton}
          onClick={() => {
            void handleLinkX();
          }}
          className="h-11 w-full rounded-xl border border-sky-100/50 bg-sky-300/20 px-4 py-2 text-sm font-semibold text-sky-50 transition hover:bg-sky-300/30 focus-visible:ring-2 focus-visible:ring-sky-200/80 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        >
          {xButtonLabel}
        </button>
        {!isAuthenticated && <p className="text-xs text-white/70">{t("connectWalletFirstForX")}</p>}
        {variant !== "onboarding" && isAuthenticated && (
          <button
            type="button"
            onClick={() => {
              void handleSignOut();
            }}
            className="rounded-xl border border-white/40 bg-black/20 px-4 py-2 text-sm font-semibold text-white/80 transition hover:bg-black/35 focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:outline-none"
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
