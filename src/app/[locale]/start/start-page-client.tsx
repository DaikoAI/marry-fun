"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
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
import { getStartOnboardingStep } from "@/lib/start/onboarding-flow";
import { shouldShowPrologueSkip } from "@/lib/start/prologue-skip";
import { useGameStore } from "@/store/game-store";

type FormSubmitEvent = Parameters<NonNullable<ComponentProps<"form">["onSubmit"]>>[0];

function isValidUsername(name: string): boolean {
  const t = name.trim();
  return t.length >= 1 && t.length <= 20;
}

export function StartPageClient() {
  const router = useRouter();
  const { triggerHaptic } = useHaptic();
  const session = authClient.useSession();
  const storedName = session.data?.user.name ?? "";
  const hasStoredUsername = isValidUsername(storedName);

  const [username, setUsername] = useState("");
  const [isSavingUsername, setIsSavingUsername] = useState(false);
  const [profileError, setProfileError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [phase, setPhase] = useState<"form" | "prologue">("form");
  const [hasInitResponse, setHasInitResponse] = useState(false);
  const [initError, setInitError] = useState(false);
  const [gameOverBlocked, setGameOverBlocked] = useState(false);
  const [isLocaleMenuOpen, setIsLocaleMenuOpen] = useState(false);
  const t = useTranslations("start");
  const locale = useLocale();
  const nextLocale: Locale = locale === "ja" ? "en" : "ja";
  const languageToggleLabel = nextLocale === "ja" ? t("switchLanguageToJa") : t("switchLanguageToEn");
  const localeMenuRef = useRef<HTMLDivElement | null>(null);

  const effectiveUsername = hasStoredUsername ? storedName.trim() : username.trim();
  const isValid = isValidUsername(effectiveUsername);

  useEffect(() => {
    if (hasStoredUsername) {
      // Sync session name to local state for pre-fill when user later disconnects
      // eslint-disable-next-line @eslint-react/hooks-extra/no-direct-set-state-in-use-effect, react-hooks-extra/no-direct-set-state-in-use-effect -- intentional sync from external session
      setUsername(storedName.trim());
    }
  }, [hasStoredUsername, storedName]);

  useEffect(() => {
    router.prefetch("/chat");
  }, [router]);

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

  const isWalletAuthenticated = Boolean(session.data?.session);
  const onboardingStep = getStartOnboardingStep({
    isWalletAuthenticated,
    requiresUsername: isWalletAuthenticated && !hasStoredUsername,
  });
  const canStart = isValid && isWalletAuthenticated && !isSubmitting && phase === "form" && !gameOverBlocked;
  const canSubmitUsername = isValid && onboardingStep === "name" && !isSavingUsername;
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

  return (
    <div className="relative h-dvh overflow-hidden text-white">
      <Background />
      <div className="absolute top-[max(env(safe-area-inset-top),1.5rem)] right-[max(env(safe-area-inset-right),1.5rem)] z-20 flex items-center gap-2">
        <BgmController />
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
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-white/35 bg-white/10 text-white shadow-[0_8px_24px_rgba(0,0,0,0.45)] backdrop-blur-md transition-colors hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-pink-200/70 focus-visible:outline-none"
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
              className="absolute top-10 right-0 flex min-w-[132px] flex-col gap-1 rounded-2xl border border-white/35 bg-black/45 p-1 shadow-[0_10px_28px_rgba(0,0,0,0.45)] backdrop-blur-md"
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
      <div className="relative z-10 mx-auto flex h-full max-w-md flex-col items-center justify-center px-6">
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
          {onboardingStep === "name" && (
            <>
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
                  className="w-full rounded-xl border-2 border-pink-200/50 bg-white/20 px-5 py-3.5 text-center text-lg font-(--font-ephemeral) tracking-wider text-white shadow-[0_0_20px_rgba(255,255,255,0.08)] backdrop-blur-md transition-colors duration-200 placeholder:text-white/50 focus:border-pink-200/80 focus:bg-white/25 focus:outline-none"
                />
              </div>
              {profileError && (
                <p className="text-sm text-red-200" role="alert">
                  {t("profileError")}
                </p>
              )}
              <button
                type="button"
                onClick={handleNameStepSubmit}
                disabled={!canSubmitUsername}
                className="rounded-full border-2 border-pink-200/40 bg-white/10 px-8 py-3 text-[clamp(0.9rem,2.5vw,1.25rem)] font-(--font-ephemeral) tracking-[0.28em] text-pink-100/80 drop-shadow-[0_8px_22px_rgba(0,0,0,0.45)] backdrop-blur-sm transition-all duration-150 ease-out hover:scale-105 focus-visible:ring-2 focus-visible:ring-pink-200/70 focus-visible:outline-none active:scale-95 disabled:pointer-events-none disabled:opacity-40"
              >
                {isSavingUsername ? t("saving") : t("next")}
              </button>
            </>
          )}
          {onboardingStep === "start" && (
            <>
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
              <button
                type="submit"
                disabled={!canStart}
                className="rounded-full border-2 border-pink-200/40 bg-white/10 px-8 py-3 text-[clamp(0.9rem,2.5vw,1.25rem)] font-(--font-ephemeral) tracking-[0.28em] text-pink-100/80 drop-shadow-[0_8px_22px_rgba(0,0,0,0.45)] backdrop-blur-sm transition-all duration-150 ease-out hover:scale-105 focus-visible:ring-2 focus-visible:ring-pink-200/70 focus-visible:outline-none active:scale-95 disabled:pointer-events-none disabled:opacity-40"
              >
                {t("submit")}
              </button>
            </>
          )}
          <div className="mt-auto w-full pb-[max(env(safe-area-inset-bottom),1.5rem)]">
            <SolanaAuthPanel variant="onboarding" />
          </div>
        </form>
      </div>
    </div>
  );
}
