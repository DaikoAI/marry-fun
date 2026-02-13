"use client";

import { useTranslations } from "next-intl";

interface SpeechBubbleContentProps {
  content: string;
  isTyping?: never;
}
interface SpeechBubbleTypingProps {
  content?: never;
  isTyping: true;
}
type SpeechBubbleProps = SpeechBubbleContentProps | SpeechBubbleTypingProps;

export function SpeechBubble(props: SpeechBubbleProps) {
  const t = useTranslations("chat.speechBubble");

  return (
    <div className="relative mx-auto w-[85%] max-w-sm">
      {/* Bubble */}
      <div className="relative rounded-2xl border border-pink-200/30 bg-white/15 px-5 py-3.5 text-base leading-relaxed font-(--font-tokimeki) tracking-wide text-white shadow-[0_4px_24px_rgba(0,0,0,0.3)] backdrop-blur-md">
        {props.isTyping ?
          <div className="flex items-center gap-1.5 py-1" aria-label={t("typingAriaLabel")}>
            <span className="h-2 w-2 animate-bounce rounded-full bg-pink-200/70 [animation-delay:0ms] motion-reduce:animate-none" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-pink-200/70 [animation-delay:150ms] motion-reduce:animate-none" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-pink-200/70 [animation-delay:300ms] motion-reduce:animate-none" />
          </div>
        : <p>{props.content}</p>}
      </div>

      {/* Tail - positioned so upper half is hidden behind bubble */}
      <div className="absolute bottom-0 left-1/2 -z-10 h-4 w-4 -translate-x-1/2 translate-y-1/2 rotate-45 border-r border-b border-pink-200/30 bg-white/15 backdrop-blur-md" />
    </div>
  );
}
