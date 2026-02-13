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
  /** When true (e.g. onboarding), hide Link X and Sign Out after auth */
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

export function SolanaAuthPanel({ variant = "default" }: SolanaAuthPanelProps) {
  const { connected, connecting, publicKey, signMessage } = useWallet();
  const { setVisible } = useWalletModal();
  const session = authClient.useSession();
  const t = useTranslations("start");
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isLinkingX, setIsLinkingX] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const hasTriggeredSignInRef = useRef(false);

  const isAuthenticated = Boolean(session.data?.session);

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
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to sign in with wallet";
      setErrorMessage(message);
    } finally {
      setIsSigningIn(false);
    }
  }, [connected, publicKey, session, signMessage, isSigningIn]);

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
    if (isLinkingX) {
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
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to link X account";
      setErrorMessage(message);
      setIsLinkingX(false);
    }
  };

  const handleSignOut = async () => {
    hasTriggeredSignInRef.current = false;
    await authClient.signOut();
    await session.refetch();
  };

  const handleConnectClick = () => {
    if (isAuthenticated) return;
    if (connected && publicKey && signMessage && !isSigningIn) {
      void handleSignIn();
    } else {
      setVisible(true);
    }
  };

  return (
    <div className="solana-auth-panel w-full rounded-2xl border border-white/30 bg-white/10 p-4 shadow-[0_12px_32px_rgba(0,0,0,0.25)] backdrop-blur-md">
      <div className="flex flex-col items-center gap-3">
        {!isAuthenticated ?
          <>
            <button
              type="button"
              disabled={connecting || isSigningIn || session.isPending}
              onClick={handleConnectClick}
              className="h-11 w-full rounded-xl border-2 border-pink-200/40 bg-white/10 px-4 py-2.5 text-sm font-semibold text-pink-100/90 shadow-[0_0_20px_rgba(255,255,255,0.06)] backdrop-blur-sm transition-all hover:scale-[1.02] hover:border-pink-200/60 hover:bg-pink-200/20 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {connecting ?
                t("connecting")
              : isSigningIn ?
                t("signing")
              : t("connectWallet")}
            </button>
            {errorMessage && <p className="text-xs text-red-200">{errorMessage}</p>}
          </>
        : <>
            <p className="text-xs text-white/75">
              {publicKey ? `${publicKey.toBase58().slice(0, 4)}...${publicKey.toBase58().slice(-4)}` : ""}
            </p>
            {variant !== "onboarding" && (
              <>
                <button
                  type="button"
                  disabled={isLinkingX}
                  onClick={() => {
                    void handleLinkX();
                  }}
                  className="rounded-xl border border-sky-100/50 bg-sky-300/20 px-4 py-2 text-sm font-semibold text-sky-50 transition hover:bg-sky-300/30 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isLinkingX ? "Redirecting to X..." : "Link X Account"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    void handleSignOut();
                  }}
                  className="rounded-xl border border-white/40 bg-black/20 px-4 py-2 text-sm font-semibold text-white/80 transition hover:bg-black/35"
                >
                  Sign Out
                </button>
              </>
            )}
          </>
        }
      </div>
    </div>
  );
}
