"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { useGameStore } from "@/store/game-store";

import { BgmController } from "./bgm-controller";
import { PumpFunIcon } from "./icons/pump-fun-icon";
import { LeaderboardModal } from "./leaderboard-modal";

function easeOut(t: number) {
  return 1 - (1 - t) ** 3;
}

export function ChatHeader() {
  const points = useGameStore(s => s.points);
  const tokenBonus = useGameStore(s => s.tokenBonus);
  const t = useTranslations("chat.header");
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  // Count-up animation
  const [displayPoints, setDisplayPoints] = useState(points);
  const prevPointsRef = useRef(points);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const prev = prevPointsRef.current;
    prevPointsRef.current = points;

    if (prev === points) return;

    const start = performance.now();
    const duration = 320;

    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const value = Math.round(prev + (points - prev) * easeOut(progress));
      setDisplayPoints(value);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [points]);

  return (
    <>
      <header className="flex items-center gap-2 px-3 py-2">
        {/* Left: BGM + Social */}
        <BgmController />

        <a
          href="https://x.com/Marrydotfun"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="X (Twitter)"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15 text-white/70 ring-1 ring-white/20 backdrop-blur-md transition hover:bg-white/20 hover:text-white"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5" aria-hidden="true">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        </a>

        <span
          aria-label="pump.fun (coming soon)"
          className="flex items-center gap-1 rounded-full bg-white/10 px-2 py-1 text-[10px] text-white/40 ring-1 ring-white/10"
        >
          <span className="tracking-wider uppercase">soon</span>
          <span className="font-semibold text-pink-200/80">$MARRY</span>
          <PumpFunIcon className="h-3.5 w-3.5" />
        </span>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Right: Points with bonus badge (when tokenBonus > 1) */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowLeaderboard(true);
            }}
            className="relative flex cursor-pointer items-center gap-1.5 rounded-full border border-pink-200/25 bg-white/10 px-4 py-1.5 backdrop-blur-sm transition-colors hover:bg-white/15"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5 text-yellow-300/70" aria-hidden="true">
              <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z" />
            </svg>
            <span className="text-xs tracking-wider text-white/50 uppercase">{t("pts")}</span>
            {tokenBonus > 1 && (
              <span
                className="shrink-0 rounded-full bg-linear-to-r from-pink-500 to-rose-500 px-1.5 py-0.5 text-[9px] leading-none font-bold text-white shadow-sm"
                aria-label={`Bonus ${String(tokenBonus)}x`}
              >
                {tokenBonus}x
              </span>
            )}
            <span className="text-sm font-(--font-tokimeki) font-bold text-white tabular-nums">
              {displayPoints.toLocaleString()}
            </span>
          </button>
        </div>
      </header>

      {showLeaderboard && (
        <LeaderboardModal
          onClose={() => {
            setShowLeaderboard(false);
          }}
        />
      )}
    </>
  );
}
