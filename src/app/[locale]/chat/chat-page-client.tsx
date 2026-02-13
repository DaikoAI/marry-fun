"use client";

import { useEffect } from "react";

import { Background } from "@/components/background";
import { ChatHeader } from "@/components/chat-header";
import { ChatInput } from "@/components/chat-input";
import { GameOverOverlay } from "@/components/game-over-overlay";
import { GirlView } from "@/components/girl-view";
import { GoalPopup } from "@/components/goal-popup";
import { PointGainToast } from "@/components/point-gain-toast";
import { useRouter } from "@/i18n/navigation";
import { useGameStore } from "@/store/game-store";

export function ChatPageClient() {
  const router = useRouter();
  const username = useGameStore(s => s.username);
  const sessionId = useGameStore(s => s.sessionId);
  const showGoalPopup = useGameStore(s => s.hasEarnedAnyPoint && !s.hasSeenGoalPopup);
  const setPoints = useGameStore(s => s.setPoints);
  const setHasSeenGoalPopup = useGameStore(s => s.setHasSeenGoalPopup);
  const isGameOver = useGameStore(s => s.isGameOver);

  useEffect(() => {
    if (!username || !sessionId) {
      router.replace("/start");
    }
  }, [username, sessionId, router]);

  useEffect(() => {
    if (!username || !sessionId) {
      return;
    }

    const controller = new AbortController();
    void fetch("/api/points/me", { signal: controller.signal })
      .then(async res => {
        if (!res.ok) {
          return;
        }
        const json: unknown = await res.json();
        if (
          typeof json === "object" &&
          json !== null &&
          "balance" in json &&
          typeof (json as { balance: unknown }).balance === "number"
        ) {
          setPoints((json as { balance: number }).balance);
        }
      })
      .catch(() => {
        // Best-effort sync only
      });

    return () => {
      controller.abort();
    };
  }, [username, sessionId, setPoints]);

  if (!username || !sessionId) return null;

  return (
    <div className="relative flex h-dvh items-center justify-center overflow-hidden text-white">
      <Background />
      <PointGainToast />
      <div className="relative z-10 mx-auto flex h-full max-h-[800px] w-full max-w-md flex-col">
        <ChatHeader />
        <GirlView />
        <ChatInput />
      </div>
      {showGoalPopup && (
        <GoalPopup
          onClose={() => {
            setHasSeenGoalPopup(true);
          }}
        />
      )}
      {isGameOver && <GameOverOverlay />}
    </div>
  );
}
