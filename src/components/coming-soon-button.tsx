"use client";

import { useState } from "react";
import { useHaptic } from "use-haptic";

export function ComingSoonButton() {
  const { triggerHaptic } = useHaptic();
  const [isPressed, setIsPressed] = useState(false);

  const handleClick = () => {
    triggerHaptic();
    setIsPressed(true);
    setTimeout(() => {
      setIsPressed(false);
    }, 150);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`shrink-0 rounded-full border-2 border-pink-200/40 bg-white/10 px-6 py-2.5 text-[clamp(0.9rem,2.5vw,1.25rem)] font-(--font-ephemeral) tracking-[0.28em] text-pink-100/80 drop-shadow-[0_8px_22px_rgba(0,0,0,0.45)] backdrop-blur-sm transition-transform duration-150 ease-out sm:px-8 sm:py-3 ${
        isPressed ? "scale-95" : "scale-100 hover:scale-105 active:scale-95"
      }`}
    >
      COMING SOON
    </button>
  );
}
