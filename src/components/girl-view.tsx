"use client";

import type { Emotion } from "@/domain/values/emotion";
import { useGameStore } from "@/store/game-store";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { SpeechBubble } from "./speech-bubble";

/** Map emotion to available image path. Falls back to default for missing assets. */
const EMOTION_IMAGES: Record<Emotion, string> = {
  default: "/girl/default.png",
  joy: "/girl/joy.png",
  embarrassed: "/girl/embarrassed.png",
  angry: "/girl/angry.png",
  sad: "/girl/sad.png",
};

/** Emotions that have confirmed image assets */
const AVAILABLE_IMAGES = new Set<Emotion>(["default", "joy", "embarrassed"]);

function getEmotionImage(emotion: Emotion): string {
  return AVAILABLE_IMAGES.has(emotion) ? EMOTION_IMAGES[emotion] : EMOTION_IMAGES.default;
}

function HeartParticles() {
  const [hearts] = useState(() =>
    Array.from({ length: 5 }, (_, i) => ({
      id: i,
      left: `${String(20 + Math.random() * 60)}%`,
      delay: `${String(i * 0.2)}s`,
    })),
  );

  return (
    <>
      {hearts.map(h => (
        <span
          key={h.id}
          className="heart-particle text-2xl"
          style={{ left: h.left, bottom: "50%", animationDelay: h.delay }}
        >
          ♡
        </span>
      ))}
    </>
  );
}

export function GirlView() {
  const messages = useGameStore(s => s.messages);
  const isGirlTyping = useGameStore(s => s.isGirlTyping);
  const currentEmotion = useGameStore(s => s.currentEmotion);
  const t = useTranslations("chat.girl");

  const lastGirlMessage = useMemo(() => messages.findLast(m => m.role === "girl"), [messages]);

  // Always show exactly one image — latest response's emotion
  const showHearts = currentEmotion === "embarrassed";

  return (
    <div className="relative flex flex-1 flex-col items-center justify-center">
      {/* Speech bubble — above character */}
      <div className="w-full px-4">
        {isGirlTyping ?
          <SpeechBubble isTyping />
        : <SpeechBubble content={lastGirlMessage?.content ?? t("initialGreeting")} />}
      </div>

      {/* Character — single image for latest emotion */}
      <div className="relative">
        <div className={`relative girl-emotion-${currentEmotion}`}>
          <Image
            src={getEmotionImage(currentEmotion)}
            alt="キャラクター"
            width={320}
            height={320}
            priority
            className="object-contain drop-shadow-lg"
          />
        </div>
        {showHearts && <HeartParticles />}
      </div>
    </div>
  );
}
