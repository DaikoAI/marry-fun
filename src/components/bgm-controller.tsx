"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import useSound from "use-sound";
import { useTranslations } from "next-intl";

type BgmStatus = "idle" | "trying" | "playing" | "stopped" | "blocked" | "error";

const BGM_SRC = "/sound/Kirameki Summer Memory.mp3";

export function BgmController() {
  const triedAutoPlayRef = useRef(false);
  const t = useTranslations("common.bgm");

  const [status, setStatus] = useState<BgmStatus>("trying");

  const soundOptions = useMemo(
    () => ({
      loop: true,
      volume: 0.55,
      interrupt: true,
      onplay: () => {
        setStatus("playing");
      },
      onstop: () => {
        setStatus("stopped");
      },
      onend: () => {
        setStatus("stopped");
      },
      onplayerror: () => {
        setStatus("blocked");
      },
      onloaderror: () => {
        setStatus("error");
      },
    }),
    [],
  );

  const [play, { stop }] = useSound(BGM_SRC, soundOptions);

  useEffect(() => {
    if (triedAutoPlayRef.current) return;
    triedAutoPlayRef.current = true;

    play();

    return () => {
      stop();
    };
  }, [play, stop]);

  const toggle = () => {
    if (status === "error") return;
    if (status === "playing") {
      stop();
      setStatus("stopped");
      return;
    }

    setStatus("trying");
    play();
  };

  const isPlaying = status === "playing";

  return (
    <button
      type="button"
      aria-pressed={isPlaying}
      aria-label={isPlaying ? t("stop") : t("play")}
      disabled={status === "error"}
      onClick={toggle}
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15 text-white/70 ring-1 ring-white/20 backdrop-blur-md transition hover:bg-white/20 hover:text-white focus-visible:ring-2 focus-visible:ring-pink-300 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isPlaying ?
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
        </svg>
      : <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
          <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
        </svg>
      }
    </button>
  );
}
