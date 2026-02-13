"use client";

import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, KeyboardEvent, SyntheticEvent } from "react";
import { useHaptic } from "use-haptic";
import { useLocale, useTranslations } from "next-intl";

import { fetchGirlResponse } from "@/lib/girl-chat";
import { useGameStore } from "@/store/game-store";

import { HelpModal } from "./help-modal";

export function ChatInput() {
  const [text, setText] = useState("");
  const [showHelp, setShowHelp] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const { triggerHaptic } = useHaptic();
  const t = useTranslations("chat.input");
  const locale = useLocale();

  const isGirlTyping = useGameStore(s => s.isGirlTyping);
  const isGoalPopupOpen = useGameStore(s => s.hasEarnedAnyPoint && !s.hasSeenGoalPopup);
  const remainingChats = useGameStore(s => s.remainingChats);
  const isGameOver = useGameStore(s => s.isGameOver);
  const noChatsLeft = useGameStore(s => s.remainingChats <= 0 || s.isGameOver);

  // Abort in-flight request on unmount
  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  const send = async () => {
    const trimmed = text.trim();
    const state = useGameStore.getState();
    if (!trimmed || state.isGirlTyping || state.remainingChats <= 0 || state.isGameOver) return;

    triggerHaptic();
    state.addMessage({ role: "user", content: trimmed });
    state.decrementRemainingChats();
    setText("");
    state.setGirlTyping(true);

    // Reset textarea height
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetchGirlResponse(state.sessionId, trimmed, locale, controller.signal);
      const store = useGameStore.getState();
      store.addMessage({ role: "girl", content: response.content });
      store.setEmotion(response.emotion);

      if (response.isGameOver && response.hitWord) {
        store.setGameOver(response.hitWord, response.content);
      } else {
        store.addPoints(response.points, response.balance);
      }
    } catch (err) {
      if (!controller.signal.aborted) throw err;
    } finally {
      if (!controller.signal.aborted) {
        useGameStore.getState().setGirlTyping(false);
        textareaRef.current?.focus();
      }
    }
  };

  const handleSubmit = (e: SyntheticEvent) => {
    e.preventDefault();
    void send();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Ignore Enter during IME composition (e.g. Japanese conversion)
    if (e.nativeEvent.isComposing) return;
    // Enter → send, Shift+Enter → newline
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send();
    }
  };

  const handleInput = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    // Auto-resize
    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${String(Math.min(el.scrollHeight, 120))}px`;
  };

  return (
    <>
      {/* Remaining chats indicator */}
      <div className="flex justify-center bg-white/30 px-3 py-1.5 backdrop-blur-xl">
        <span
          className={`text-xs font-(--font-tokimeki) drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)] ${noChatsLeft ? "text-red-300" : "text-white/70"}`}
        >
          {noChatsLeft ? t("noChatsLeft") : t("chatsLeft", { count: remainingChats })}
        </span>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex items-end gap-2 border-t border-pink-200/20 bg-white/5 px-3 py-2 backdrop-blur-md"
        style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
      >
        {/* Help button */}
        <button
          type="button"
          aria-label={t("helpAriaLabel")}
          onClick={() => {
            setShowHelp(true);
          }}
          className="mb-0.5 flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full bg-white/15 text-sm text-white/70 ring-1 ring-white/20 backdrop-blur-md transition-colors hover:bg-white/20 hover:text-white focus-visible:ring-2 focus-visible:ring-pink-300 focus-visible:outline-none"
        >
          ?
        </button>

        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder={noChatsLeft ? t("noChatsLeft") : t("placeholder")}
          aria-label={t("inputAriaLabel")}
          maxLength={200}
          disabled={isGirlTyping || isGoalPopupOpen || isGameOver || noChatsLeft}
          autoComplete="off"
          rows={1}
          className="max-h-[120px] min-h-[40px] flex-1 resize-none overflow-hidden rounded-2xl border border-pink-200/30 bg-white/10 px-4 py-2.5 text-sm font-(--font-tokimeki) text-white backdrop-blur-sm transition-colors placeholder:text-white/40 focus:border-pink-200/60 focus:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-300 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!text.trim() || isGirlTyping || isGoalPopupOpen || isGameOver || noChatsLeft}
          className="mb-0.5 flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full border border-pink-200/40 bg-white/15 text-white/80 backdrop-blur-sm transition-[transform,background-color,opacity] hover:scale-105 hover:bg-white/25 focus-visible:ring-2 focus-visible:ring-pink-300 focus-visible:outline-none active:scale-95 disabled:pointer-events-none disabled:opacity-40"
          aria-label={t("sendAriaLabel")}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </button>
      </form>

      {showHelp && (
        <HelpModal
          onClose={() => {
            setShowHelp(false);
          }}
        />
      )}
    </>
  );
}
