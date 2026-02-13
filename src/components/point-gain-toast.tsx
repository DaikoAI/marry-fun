"use client";

import { useEffect } from "react";

import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { useGameStore } from "@/store/game-store";

const TOAST_DURATION_MS = 1100;
const TOAST_DURATION_REDUCED_MS = 700;
const TOAST_TOP_OFFSET_PX = 68;

export function PointGainToast() {
  const lastPointsEarned = useGameStore(s => s.lastPointsEarned);
  const pointGainEventId = useGameStore(s => s.pointGainEventId);
  const clearLastPoints = useGameStore(s => s.clearLastPoints);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (lastPointsEarned == null || lastPointsEarned <= 0) return;

    const timeout = setTimeout(
      () => {
        clearLastPoints();
      },
      (reducedMotion ? TOAST_DURATION_REDUCED_MS : TOAST_DURATION_MS) + 120,
    );

    return () => {
      clearTimeout(timeout);
    };
  }, [clearLastPoints, pointGainEventId, lastPointsEarned, reducedMotion]);

  if (lastPointsEarned == null || lastPointsEarned <= 0) return null;

  return (
    <div
      className="pointer-events-none fixed left-1/2 z-40 -translate-x-1/2"
      style={{ top: `max(${String(TOAST_TOP_OFFSET_PX)}px, calc(env(safe-area-inset-top) + 44px))` }}
      aria-live="polite"
      aria-atomic="true"
    >
      <span
        key={`${String(lastPointsEarned)}-${String(pointGainEventId)}`}
        className={`inline-flex rounded-full border border-[#22c55e]/70 bg-black/40 px-4 py-1 text-base font-black text-[#22c55e] drop-shadow-[0_0_14px_rgba(34,197,94,0.55)] backdrop-blur-sm ${
          reducedMotion ? "point-gain-toast-reduced" : "point-gain-toast"
        }`}
        onAnimationEnd={() => {
          clearLastPoints();
        }}
      >
        +{lastPointsEarned}
      </span>
    </div>
  );
}
