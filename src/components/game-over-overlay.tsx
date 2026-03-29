"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { useModalA11y } from "@/hooks/use-modal-a11y";
import { useRouter } from "@/i18n/navigation";
import { useGameStore } from "@/store/game-store";

export function GameOverOverlay() {
  const [visible, setVisible] = useState(false);
  const t = useTranslations("chat.gameOver");
  const router = useRouter();

  const hitWord = useGameStore(s => s.hitWord);
  const shockMessage = useGameStore(s => s.shockMessage);
  const resetGame = useGameStore(s => s.resetGame);

  const handleRetry = () => {
    resetGame();
    router.push("/");
  };

  const dialogRef = useModalA11y(handleRetry);

  // Delay overlay appearance by 1 second so the player can read the shock message in the chat
  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(true);
    }, 1000);
    return () => {
      clearTimeout(timer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="game-over-title"
      className="game-over-overlay fixed inset-0 z-50 flex flex-col items-center justify-center overscroll-contain"
    >
      {/* Dark backdrop */}
      <div className="absolute inset-0 bg-black/90" />

      {/* Red flash effect */}
      <div className="game-over-flash absolute inset-0" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-6 px-6 text-center">
        {/* GAME OVER text */}
        <h1
          id="game-over-title"
          className="game-over-text text-5xl font-black tracking-widest text-red-500 sm:text-6xl"
          style={{ fontFamily: "var(--font-tokimeki), sans-serif" }}
        >
          {t("title")}
        </h1>

        {/* Hit NG word */}
        {hitWord && (
          <p className="text-lg text-white/80">
            <span className="text-white/60">{t("tabooWord")}: </span>
            <span className="rounded bg-red-500/30 px-2 py-0.5 font-bold text-red-300">「{hitWord}」</span>
          </p>
        )}

        {/* Shock message from the character */}
        {shockMessage && <p className="max-w-xs text-base leading-relaxed text-white/70 italic">{shockMessage}</p>}

        {/* Retry button */}
        <button
          type="button"
          onClick={handleRetry}
          className="mt-4 cursor-pointer rounded-full border border-pink-300/40 bg-white/10 px-8 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-[background-color,transform] hover:scale-105 hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-pink-300 focus-visible:outline-none active:scale-95"
        >
          {t("retry")}
        </button>
      </div>
    </div>
  );
}
