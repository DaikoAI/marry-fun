"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { ComponentProps } from "react";
import { useHaptic } from "use-haptic";
import { useLocale, useTranslations } from "next-intl";

import { Background } from "@/components/background";
import { PrologueOverlay } from "@/components/prologue-overlay";
import { Link, useRouter } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { routing } from "@/i18n/routing";
import type { InitGameResult } from "@/lib/girl-chat";
import { useGameStore } from "@/store/game-store";

const localeConfig: Record<Locale, { flag: string; label: string }> = {
  en: { flag: "\u{1F1FA}\u{1F1F8}", label: "EN" },
  ja: { flag: "\u{1F1EF}\u{1F1F5}", label: "\u65E5\u672C\u8A9E" },
};

type FormSubmitEvent = Parameters<NonNullable<ComponentProps<"form">["onSubmit"]>>[0];

export default function StartPage() {
  const router = useRouter();
  const { triggerHaptic } = useHaptic();
  const [username, setUsername] = useState("");
  const [phase, setPhase] = useState<"form" | "prologue">("form");
  const t = useTranslations("start");
  const locale = useLocale();

  useEffect(() => {
    router.prefetch("/chat");
  }, [router]);

  const apiResultRef = useRef<InitGameResult | null>(null);
  const apiErrorRef = useRef<boolean>(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Clean up polling interval on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  const isValid = username.trim().length >= 1 && username.trim().length <= 20;

  const setupStoreAndNavigate = (result: InitGameResult) => {
    const store = useGameStore.getState();
    store.resetGame();
    store.setUsername(username.trim());
    store.setSessionId(result.sessionId);
    store.addMessage({ role: "girl", content: result.greeting.content });
    router.push("/chat");
  };

  const handleSubmit = (e: FormSubmitEvent) => {
    e.preventDefault();
    if (!isValid || phase !== "form") return;
    triggerHaptic();
    setPhase("prologue");

    // Start API call in background (don't await)
    void import("@/lib/girl-chat").then(async ({ initGameSession }) => {
      try {
        apiResultRef.current = await initGameSession(username.trim(), locale);
      } catch {
        apiErrorRef.current = true;
      }
    });
  };

  const handlePrologueComplete = () => {
    if (apiErrorRef.current) {
      setPhase("form");
      return;
    }
    if (apiResultRef.current) {
      setupStoreAndNavigate(apiResultRef.current);
      return;
    }
    // API not yet complete — poll until ready
    const id = setInterval(() => {
      if (apiErrorRef.current) {
        clearInterval(id);
        pollingRef.current = null;
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

  return (
    <div className="relative h-dvh overflow-hidden text-white">
      <Background />

      {/* Prologue Overlay */}
      <PrologueOverlay isVisible={phase === "prologue"} onComplete={handlePrologueComplete} />

      {/* Content */}
      <div className="relative z-10 mx-auto flex h-full max-w-md flex-col items-center justify-center px-6">
        <form
          onSubmit={handleSubmit}
          className="flex w-full animate-[fadeIn_1200ms_cubic-bezier(0.22,1,0.36,1)_both] flex-col items-center gap-8 motion-reduce:animate-none"
        >
          {/* Logo */}
          <Image
            src="/logo.png"
            alt="marry.fun"
            priority
            width={720}
            height={240}
            className="mb-4 h-auto w-[min(320px,65vw)] drop-shadow-[0_18px_60px_rgba(0,0,0,0.55)]"
          />

          {/* Language Switcher */}
          <div className="flex items-center gap-2">
            {routing.locales.map(l => {
              const config = localeConfig[l];
              return (
                <Link
                  key={l}
                  href="/start"
                  locale={l}
                  className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-bold backdrop-blur-md transition-colors ${
                    l === locale ?
                      "bg-white/25 text-white ring-1 ring-white/40"
                    : "bg-white/10 text-white/50 hover:bg-white/20 hover:text-white/80"
                  }`}
                >
                  <span className="text-base" aria-hidden="true">
                    {config.flag}
                  </span>
                  {config.label}
                </Link>
              );
            })}
          </div>

          {/* Username Input */}
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
              autoFocus
              className="w-full rounded-xl border-2 border-pink-200/50 bg-white/20 px-5 py-3.5 text-center text-lg font-(--font-ephemeral) tracking-wider text-white shadow-[0_0_20px_rgba(255,255,255,0.08)] backdrop-blur-md transition-colors duration-200 placeholder:text-white/50 focus:border-pink-200/80 focus:bg-white/25 focus:outline-none"
            />
          </div>

          {/* Play Now Button */}
          <button
            type="submit"
            disabled={!isValid || phase !== "form"}
            className="rounded-full border-2 border-pink-200/40 bg-white/10 px-8 py-3 text-[clamp(0.9rem,2.5vw,1.25rem)] font-(--font-ephemeral) tracking-[0.28em] text-pink-100/80 drop-shadow-[0_8px_22px_rgba(0,0,0,0.45)] backdrop-blur-sm transition-all duration-150 ease-out hover:scale-105 active:scale-95 disabled:pointer-events-none disabled:opacity-40"
          >
            {t("submit")}
          </button>
        </form>
      </div>
    </div>
  );
}
