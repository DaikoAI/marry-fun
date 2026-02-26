"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ComponentProps } from "react";
import { useHaptic } from "use-haptic";
import { useLocale, useTranslations } from "next-intl";

import { SolanaAuthPanel } from "@/components/auth/solana-auth-panel";
import { Background } from "@/components/background";
import { BgmController } from "@/components/bgm-controller";
import { PrologueOverlay } from "@/components/prologue-overlay";
import { Link, useRouter } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { authClient } from "@/lib/auth/auth-client";
import type { InitGameResult } from "@/lib/girl-chat";
import { getStartOnboardingPhase } from "@/lib/start/onboarding-flow";
import { shouldShowPrologueSkip } from "@/lib/start/prologue-skip";
import { runWithViewTransition } from "@/lib/start/view-transition";
import { useGameStore } from "@/store/game-store";
import { logger } from "@/utils/logger";

type FormSubmitEvent = Parameters<NonNullable<ComponentProps<"form">["onSubmit"]>>[0];

type StartPageUiPhase = "form" | "prologue";
const IS_PLAY_NOW_ENABLED = process.env.NEXT_PUBLIC_ENABLE_PLAY_NOW === "true";

function isValidUsername(name: string): boolean {
  const t = name.trim();
  return t.length >= 1 && t.length <= 20;
}

function readApiErrorMessage(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  if ("message" in payload && typeof payload.message === "string" && payload.message.length > 0) {
    return payload.message;
  }

  return null;
}

export function readGeneratedProfileImageUrl(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  if ("imageUrl" in payload && typeof payload.imageUrl === "string" && payload.imageUrl.length > 0) {
    return payload.imageUrl;
  }

  return null;
}

export function StartPageClient() {
  const router = useRouter();
  const { triggerHaptic } = useHaptic();
  const session = authClient.useSession();
  const storedName = session.data?.user.name ?? "";
  const hasStoredUsername = isValidUsername(storedName);
  const userImage = session.data?.user.image ?? null;

  const [username, setUsername] = useState("");
  const [isSavingUsername, setIsSavingUsername] = useState(false);
  const [profileError, setProfileError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [phase, setPhase] = useState<StartPageUiPhase>("form");
  const [hasInitResponse, setHasInitResponse] = useState(false);
  const [initError, setInitError] = useState(false);
  const [gameOverBlocked, setGameOverBlocked] = useState(false);
  const [isLocaleMenuOpen, setIsLocaleMenuOpen] = useState(false);
  const [isXLinked, setIsXLinked] = useState(false);
  const [isCheckingXLink, setIsCheckingXLink] = useState(false);
  const [isGeneratingProfile, setIsGeneratingProfile] = useState(false);
  const [isPreparingShare, setIsPreparingShare] = useState(false);
  const [profileActionError, setProfileActionError] = useState<string | null>(null);
  const t = useTranslations("start");
  const locale = useLocale();
  const localeMenuRef = useRef<HTMLDivElement | null>(null);

  const effectiveUsername = hasStoredUsername ? storedName.trim() : username.trim();
  const isValid = isValidUsername(effectiveUsername);
  const isWalletAuthenticated = Boolean(session.data?.session);

  const onboardingPhase = getStartOnboardingPhase({
    isWalletAuthenticated,
    isXLinked,
    username: storedName,
    profileImage: userImage,
  });
  const [displayOnboardingPhase, setDisplayOnboardingPhase] = useState(onboardingPhase);

  /* eslint-disable react-you-might-not-need-an-effect/no-event-handler */
  useEffect(() => {
    if (displayOnboardingPhase === onboardingPhase) return;

    runWithViewTransition(document, () => {
      setDisplayOnboardingPhase(onboardingPhase);
    });
  }, [displayOnboardingPhase, onboardingPhase]);
  /* eslint-enable react-you-might-not-need-an-effect/no-event-handler */

  useEffect(() => {
    if (hasStoredUsername) {
      // eslint-disable-next-line @eslint-react/hooks-extra/no-direct-set-state-in-use-effect, react-hooks-extra/no-direct-set-state-in-use-effect -- intentional sync from external session
      setUsername(storedName.trim());
    }
  }, [hasStoredUsername, storedName]);

  useEffect(() => {
    router.prefetch("/chat");
  }, [router]);

  const refreshXLinkStatus = useCallback(async () => {
    if (!isWalletAuthenticated) {
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

      if (payload && typeof payload === "object" && "linked" in payload && typeof payload.linked === "boolean") {
        setIsXLinked(payload.linked);
        return;
      }

      setIsXLinked(false);
    } catch {
      setIsXLinked(false);
    } finally {
      setIsCheckingXLink(false);
    }
  }, [isWalletAuthenticated]);

  useEffect(() => {
    void refreshXLinkStatus();
  }, [refreshXLinkStatus]);

  const apiResultRef = useRef<InitGameResult | null>(null);
  const apiErrorRef = useRef<boolean>(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  useEffect(() => {
    if (!isLocaleMenuOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!localeMenuRef.current?.contains(event.target as Node)) {
        setIsLocaleMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsLocaleMenuOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isLocaleMenuOpen]);

  const canStart =
    IS_PLAY_NOW_ENABLED &&
    isValid &&
    isWalletAuthenticated &&
    !isSubmitting &&
    phase === "form" &&
    !gameOverBlocked &&
    onboardingPhase === "ready";
  const canSubmitUsername = isValid && onboardingPhase === "username" && !isSavingUsername;
  const canSkipPrologue = shouldShowPrologueSkip({ phase, hasInitResponse });

  const setupStoreAndNavigate = (result: InitGameResult) => {
    const store = useGameStore.getState();
    store.resetGame();
    store.setUsername(effectiveUsername);
    store.setSessionId(result.sessionId);
    store.setRemainingChats(result.remainingChats);
    if (result.greeting.content) {
      store.addMessage({ role: "girl", content: result.greeting.content });
    }
    router.push("/chat");
  };

  const handleSubmit = (e: FormSubmitEvent) => {
    e.preventDefault();
    if (!canStart) return;
    triggerHaptic();
    setInitError(false);
    apiErrorRef.current = false;
    apiResultRef.current = null;
    setHasInitResponse(false);
    setIsSubmitting(true);
    setPhase("prologue");

    const nameToUse = effectiveUsername;

    void (async () => {
      try {
        const { initGameSession } = await import("@/lib/girl-chat");
        apiResultRef.current = await initGameSession(nameToUse, locale);
        setHasInitResponse(true);
      } catch (err) {
        if ((err as Error & { code?: string }).code === "GAME_OVER_BLOCKED") {
          setGameOverBlocked(true);
          setIsSubmitting(false);
          setPhase("form");
          return;
        }
        apiErrorRef.current = true;
        setHasInitResponse(false);
      }
    })();
  };

  const handlePrologueComplete = () => {
    if (apiErrorRef.current) {
      setInitError(true);
      setIsSubmitting(false);
      setHasInitResponse(false);
      setPhase("form");
      return;
    }
    if (apiResultRef.current) {
      setupStoreAndNavigate(apiResultRef.current);
      return;
    }
    const id = setInterval(() => {
      if (apiErrorRef.current) {
        clearInterval(id);
        pollingRef.current = null;
        setInitError(true);
        setIsSubmitting(false);
        setHasInitResponse(false);
        setPhase("form");
        return;
      }
      if (apiResultRef.current) {
        clearInterval(id);
        pollingRef.current = null;
        setupStoreAndNavigate(apiResultRef.current);
      }
    }, 200);
    pollingRef.current = id;
  };

  const handleNameStepSubmit = () => {
    if (!canSubmitUsername) return;
    const nextUsername = username.trim();
    if (!isValidUsername(nextUsername)) return;

    setProfileError(false);
    setIsSavingUsername(true);

    void authClient
      .updateUser({ name: nextUsername })
      .then(({ error }) => {
        if (error) {
          setProfileError(true);
          return;
        }
        void session.refetch();
      })
      .finally(() => {
        setIsSavingUsername(false);
      });
  };

  const handleGenerateProfileImage = () => {
    if (onboardingPhase !== "profile" || isGeneratingProfile) return;

    logger.info("[start] profile image generation requested", {
      locale,
      onboardingPhase,
    });
    setProfileActionError(null);
    setIsGeneratingProfile(true);

    void (async () => {
      try {
        const response = await fetch("/api/profile-image/generate", {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({ locale }),
        });

        const payload: unknown = await response.json().catch(() => null);
        const imageUrl = readGeneratedProfileImageUrl(payload);
        logger.info("[start] profile image generation response", {
          ok: response.ok,
          status: response.status,
          hasImageUrl: Boolean(imageUrl),
        });
        if (!response.ok) {
          throw new Error(readApiErrorMessage(payload) ?? t("profileImageGenerateError"));
        }

        await session.refetch();
        logger.info("[start] profile image generation success", {
          imageUrl: imageUrl ?? "n/a",
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : t("profileImageGenerateError");
        logger.error("[start] profile image generation failed", {
          message,
        });
        setProfileActionError(message);
      } finally {
        setIsGeneratingProfile(false);
      }
    })();
  };

  const handleShareOnX = () => {
    if (!userImage || isPreparingShare) return;

    setProfileActionError(null);
    setIsPreparingShare(true);

    void (async () => {
      try {
        const response = await fetch("/api/profile-share/token", {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({ locale }),
        });

        const payload: unknown = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(readApiErrorMessage(payload) ?? t("profileShareError"));
        }

        const intentUrl =
          payload && typeof payload === "object" && "intentUrl" in payload && typeof payload.intentUrl === "string" ?
            payload.intentUrl
          : null;

        if (!intentUrl) {
          throw new Error(t("profileShareError"));
        }

        window.open(intentUrl, "_blank", "noopener,noreferrer");
      } catch (error) {
        const message = error instanceof Error ? error.message : t("profileShareError");
        setProfileActionError(message);
      } finally {
        setIsPreparingShare(false);
      }
    })();
  };

  return (
    <div className="relative h-dvh overflow-hidden text-white">
      <Background />
      <div className="absolute top-[max(env(safe-area-inset-top),1.5rem)] right-[max(env(safe-area-inset-right),1.5rem)] z-20 flex items-center gap-2">
        <BgmController className="h-8 w-8" />
        <div ref={localeMenuRef} className="relative">
          <button
            type="button"
            aria-label={t("openLanguageMenu")}
            aria-haspopup="menu"
            aria-expanded={isLocaleMenuOpen}
            aria-controls="language-menu"
            onClick={() => {
              setIsLocaleMenuOpen(prev => !prev);
            }}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-white/50 bg-black/45 text-white shadow-[0_8px_24px_rgba(0,0,0,0.55)] backdrop-blur-md transition-colors hover:bg-black/60 focus-visible:ring-2 focus-visible:ring-pink-200/70 focus-visible:outline-none"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-2">
              <circle cx="12" cy="12" r="9" />
              <path d="M3 12h18" />
              <path d="M12 3a15 15 0 0 1 0 18" />
              <path d="M12 3a15 15 0 0 0 0 18" />
            </svg>
          </button>
          {isLocaleMenuOpen && (
            <div
              id="language-menu"
              role="menu"
              className="absolute top-10 right-0 flex min-w-[132px] flex-col gap-1 rounded-2xl border border-white/50 bg-black/70 p-1 shadow-[0_12px_30px_rgba(0,0,0,0.6)] backdrop-blur-md"
            >
              {(
                [
                  { locale: "en", label: "EN", emoji: "🇺🇸", title: t("switchLanguageToEn") },
                  { locale: "ja", label: "日本語", emoji: "🇯🇵", title: t("switchLanguageToJa") },
                ] as const satisfies ReadonlyArray<{ locale: Locale; label: string; emoji: string; title: string }>
              ).map(item => (
                <Link
                  key={item.locale}
                  href="/"
                  locale={item.locale}
                  role="menuitem"
                  title={item.title}
                  onClick={() => {
                    setIsLocaleMenuOpen(false);
                  }}
                  className={`flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-semibold tracking-wide transition-colors ${
                    locale === item.locale ?
                      "bg-white/30 text-white"
                    : "text-white/80 hover:bg-white/20 hover:text-white"
                  }`}
                >
                  <span aria-hidden="true">{item.emoji}</span>
                  {item.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
      <PrologueOverlay
        isVisible={phase === "prologue"}
        onComplete={handlePrologueComplete}
        canSkip={canSkipPrologue}
        onSkip={handlePrologueComplete}
      />
      <div className="relative z-10 mx-auto flex h-full max-w-md flex-col items-center justify-center px-6 [text-shadow:0_1px_6px_rgba(0,0,0,0.75)]">
        <form
          onSubmit={handleSubmit}
          className="flex h-full w-full animate-[fadeIn_1200ms_cubic-bezier(0.22,1,0.36,1)_both] flex-col items-center gap-8 motion-reduce:animate-none"
        >
          <Image
            src="/logo.webp"
            alt="marry.fun"
            priority
            width={720}
            height={240}
            className="mt-[max(env(safe-area-inset-top),3.5rem)] mb-4 h-auto w-[min(320px,65vw)] drop-shadow-[0_18px_60px_rgba(0,0,0,0.55)]"
          />

          <div className="w-full rounded-2xl border border-white/30 bg-black/50 p-4 shadow-[0_18px_48px_rgba(0,0,0,0.5)] backdrop-blur-md [view-transition-name:onboarding-phase-panel] sm:p-5">
            {displayOnboardingPhase === "connect" && (
              <div className="space-y-3 text-center">
                <p className="text-base font-semibold text-white">{t("connectPhaseTitle")}</p>
                <p className="text-sm text-white/95">{t("connectPhaseDescription")}</p>
                <p className="text-xs font-medium text-white/90" role="status" aria-live="polite">
                  {isWalletAuthenticated ? t("walletConnectedStatus") : t("walletPendingStatus")} /{" "}
                  {isXLinked ?
                    t("xConnectedStatus")
                  : isCheckingXLink ?
                    t("xCheckingStatus")
                  : t("xPendingStatus")}
                </p>
              </div>
            )}

            {displayOnboardingPhase === "username" && (
              <>
                <p className="mb-3 text-center text-base font-semibold text-white">{t("usernamePhaseTitle")}</p>
                <div className="w-full">
                  <input
                    type="text"
                    name="username"
                    aria-label={t("placeholder")}
                    value={username}
                    onChange={e => {
                      setUsername(e.target.value);
                    }}
                    placeholder={t("placeholder")}
                    maxLength={20}
                    autoComplete="off"
                    spellCheck={false}
                    autoFocus
                    className="w-full rounded-lg border-2 border-pink-200/60 bg-black/55 px-4 py-2.5 text-center text-base font-(--font-ephemeral) tracking-wider text-white shadow-[0_0_20px_rgba(255,255,255,0.08)] backdrop-blur-md transition-colors duration-200 placeholder:text-white/75 focus:border-pink-200/80 focus:bg-black/65 focus:outline-none"
                  />
                </div>
                {profileError && (
                  <p className="mt-2 text-sm text-red-200" role="alert">
                    {t("profileError")}
                  </p>
                )}
                <button
                  type="button"
                  onClick={handleNameStepSubmit}
                  disabled={!canSubmitUsername}
                  className="mt-4 rounded-full border-2 border-pink-200/50 bg-black/55 px-8 py-3 text-[clamp(0.9rem,2.5vw,1.25rem)] font-(--font-ephemeral) tracking-[0.28em] text-pink-100 drop-shadow-[0_8px_22px_rgba(0,0,0,0.45)] backdrop-blur-md transition-all duration-150 ease-out hover:scale-105 focus-visible:ring-2 focus-visible:ring-pink-200/70 focus-visible:outline-none active:scale-95 disabled:pointer-events-none disabled:opacity-40"
                >
                  {isSavingUsername ? t("saving") : t("next")}
                </button>
              </>
            )}

            {displayOnboardingPhase === "profile" && (
              <div className="space-y-3 text-center">
                <div className="rounded-xl border border-white/25 bg-black/60 px-4 py-3 backdrop-blur-sm">
                  <p className="text-base font-semibold text-white">{t("profilePhaseTitle")}</p>
                  <p className="mt-1 text-sm leading-snug text-white/95">{t("profilePhaseDescription")}</p>
                </div>

                {userImage && (
                  <div className="mx-auto mt-3 w-[180px] overflow-hidden rounded-2xl border border-white/60 bg-black/60 shadow-[0_10px_24px_rgba(0,0,0,0.45)]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={userImage}
                      alt={t("profilePreviewAlt")}
                      className="h-[225px] w-full object-cover"
                      onLoad={event => {
                        logger.info("[start] profile preview loaded", {
                          phase: "profile",
                          src: event.currentTarget.currentSrc || event.currentTarget.src,
                        });
                      }}
                      onError={event => {
                        logger.warn("[start] profile preview failed to load", {
                          phase: "profile",
                          src: event.currentTarget.currentSrc || event.currentTarget.src,
                        });
                      }}
                    />
                  </div>
                )}

                <div className="mt-2 flex flex-col items-center gap-2">
                  <button
                    type="button"
                    onClick={handleGenerateProfileImage}
                    disabled={isGeneratingProfile}
                    className="rounded-full border-2 border-pink-200/50 bg-black/55 px-6 py-2.5 text-sm font-semibold tracking-wide text-pink-100 transition-all hover:scale-105 focus-visible:ring-2 focus-visible:ring-pink-200/70 focus-visible:outline-none active:scale-95 disabled:pointer-events-none disabled:opacity-45"
                  >
                    {isGeneratingProfile ? t("generatingProfileImage") : t("generateProfileImage")}
                  </button>
                  <button
                    type="button"
                    onClick={handleShareOnX}
                    disabled={!userImage || isPreparingShare}
                    className="rounded-full border border-sky-200/70 bg-sky-500/40 px-6 py-2.5 text-sm font-semibold tracking-wide text-sky-50 transition-colors hover:bg-sky-500/50 focus-visible:ring-2 focus-visible:ring-sky-200/80 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-45"
                  >
                    {isPreparingShare ? t("preparingShare") : t("shareProfileOnX")}
                  </button>
                </div>

                {profileActionError && (
                  <p className="text-sm text-red-200" role="alert">
                    {profileActionError}
                  </p>
                )}
              </div>
            )}

            {displayOnboardingPhase === "ready" && (
              <>
                {userImage && (
                  <div className="mx-auto mb-3 w-[180px] overflow-hidden rounded-2xl border border-white/50 bg-black/45 shadow-[0_10px_24px_rgba(0,0,0,0.45)]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={userImage}
                      alt={t("profilePreviewAlt")}
                      className="h-[225px] w-full object-cover"
                      onLoad={event => {
                        logger.info("[start] profile preview loaded", {
                          phase: "ready",
                          src: event.currentTarget.currentSrc || event.currentTarget.src,
                        });
                      }}
                      onError={event => {
                        logger.warn("[start] profile preview failed to load", {
                          phase: "ready",
                          src: event.currentTarget.currentSrc || event.currentTarget.src,
                        });
                      }}
                    />
                  </div>
                )}
                <p className="text-center text-sm text-white/85">{t("readyPhaseDescription")}</p>
                {gameOverBlocked && (
                  <p className="text-sm text-red-200" role="alert">
                    {t("gameOverBlocked")}
                  </p>
                )}
                {initError && (
                  <p className="text-sm text-red-200" role="alert">
                    {t("initError")}
                  </p>
                )}
              </>
            )}
          </div>

          <div className="mt-auto w-full pb-[max(env(safe-area-inset-bottom),1.5rem)]">
            <SolanaAuthPanel variant="onboarding" />
          </div>
        </form>
      </div>
    </div>
  );
}
