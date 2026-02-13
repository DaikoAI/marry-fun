"use client";

import { useEffect, useReducer, useRef } from "react";
import { useTranslations } from "next-intl";

import { Background } from "@/components/background";
import { useModalA11y } from "@/hooks/use-modal-a11y";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";

const noop = () => {};

interface PrologueOverlayProps {
  isVisible: boolean;
  onComplete: () => void;
  canSkip?: boolean;
  onSkip?: () => void;
}

const STEP_KEYS = ["step1", "step2"] as const;
const TYPE_INTERVAL_MS = 50;
const STEP_PAUSE_MS = 800;
const FADE_OUT_MS = 500;

interface PrologueState {
  currentStep: number;
  displayedText: string;
  isTyping: boolean;
  isFadingOut: boolean;
  stepsFinished: boolean;
}

type PrologueAction =
  | { type: "START_TYPING"; text: string }
  | { type: "APPEND_CHAR"; text: string; charIndex: number }
  | { type: "SHOW_FULL"; text: string }
  | { type: "FINISH_TYPING" }
  | { type: "FADE_OUT" }
  | { type: "ADVANCE_STEP" }
  | { type: "FINISH_ALL" };

function prologueReducer(state: PrologueState, action: PrologueAction): PrologueState {
  switch (action.type) {
    case "START_TYPING":
      return { ...state, displayedText: "", isTyping: true, isFadingOut: false };
    case "APPEND_CHAR":
      return { ...state, displayedText: action.text.slice(0, action.charIndex) };
    case "SHOW_FULL":
      return { ...state, displayedText: action.text, isTyping: false };
    case "FINISH_TYPING":
      return { ...state, isTyping: false };
    case "FADE_OUT":
      return { ...state, isFadingOut: true };
    case "ADVANCE_STEP":
      return { ...state, currentStep: state.currentStep + 1, isFadingOut: false };
    case "FINISH_ALL":
      return { ...state, stepsFinished: true, isFadingOut: false };
    default:
      return state;
  }
}

const initialState: PrologueState = {
  currentStep: 0,
  displayedText: "",
  isTyping: false,
  isFadingOut: false,
  stepsFinished: false,
};

export function PrologueOverlay({ isVisible, onComplete, canSkip = false, onSkip }: PrologueOverlayProps) {
  const t = useTranslations("prologue");
  const reducedMotion = usePrefersReducedMotion();
  const dialogRef = useModalA11y(noop);
  const [state, dispatch] = useReducer(prologueReducer, initialState);
  const { currentStep, displayedText, isTyping, isFadingOut, stepsFinished } = state;

  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const fullText = currentStep < STEP_KEYS.length ? t(STEP_KEYS[currentStep]) : "";

  // Typewriter effect
  useEffect(() => {
    if (!isVisible || currentStep >= STEP_KEYS.length) return;

    const text = t(STEP_KEYS[currentStep]);

    if (reducedMotion) {
      dispatch({ type: "SHOW_FULL", text });
      const timer = setTimeout(() => {
        if (currentStep < STEP_KEYS.length - 1) {
          dispatch({ type: "ADVANCE_STEP" });
        } else {
          dispatch({ type: "FINISH_ALL" });
          onCompleteRef.current();
        }
      }, STEP_PAUSE_MS);
      return () => {
        clearTimeout(timer);
      };
    }

    dispatch({ type: "START_TYPING", text });
    let charIndex = 0;

    const interval = setInterval(() => {
      charIndex++;
      dispatch({ type: "APPEND_CHAR", text, charIndex });
      if (charIndex >= text.length) {
        clearInterval(interval);
        dispatch({ type: "FINISH_TYPING" });
      }
    }, TYPE_INTERVAL_MS);

    return () => {
      clearInterval(interval);
    };
  }, [isVisible, currentStep, reducedMotion, t]);

  // Auto-advance: typing done → pause → fade out → next step
  useEffect(() => {
    if (!isVisible || isTyping || isFadingOut || currentStep >= STEP_KEYS.length) return;
    if (displayedText !== fullText) return;

    // Wait, then start fade out
    const pauseTimer = setTimeout(() => {
      if (currentStep < STEP_KEYS.length - 1) {
        dispatch({ type: "FADE_OUT" });
      } else {
        dispatch({ type: "FINISH_ALL" });
        onCompleteRef.current();
      }
    }, STEP_PAUSE_MS);

    return () => {
      clearTimeout(pauseTimer);
    };
  }, [isVisible, isTyping, isFadingOut, currentStep, displayedText, fullText]);

  // After fade out animation completes, advance to next step
  useEffect(() => {
    if (!isFadingOut) return;

    const fadeTimer = setTimeout(() => {
      dispatch({ type: "ADVANCE_STEP" });
    }, FADE_OUT_MS);

    return () => {
      clearTimeout(fadeTimer);
    };
  }, [isFadingOut]);

  if (!isVisible) return null;

  return (
    <div
      ref={dialogRef}
      className="prologue-overlay fixed inset-0 z-50 flex flex-col items-center justify-center overscroll-contain"
      role="dialog"
      aria-modal="true"
      aria-label="Prologue"
    >
      {/* Background with dark overlay */}
      <div className="absolute inset-0">
        <Background />
        <div className="absolute inset-0 bg-black/70" />
      </div>

      {/* Center text */}
      <div className="relative z-10 flex w-full max-w-lg items-center justify-center px-8">
        <p
          className={`text-center text-lg leading-loose tracking-wider text-white/90 sm:text-xl ${
            isFadingOut ? "prologue-text-exit" : "prologue-text-enter"
          }`}
          style={{ fontFamily: "var(--font-tokimeki), sans-serif" }}
          aria-live="polite"
        >
          {stepsFinished ?
            <span className="prologue-waiting-text text-white/60">{t("waiting")}</span>
          : <>
              {displayedText}
              {isTyping && <span className="prologue-cursor ml-0.5 text-pink-300">|</span>}
            </>
          }
        </p>
      </div>

      {canSkip && (
        <button
          type="button"
          onClick={onSkip ?? onComplete}
          className="absolute right-4 bottom-4 z-20 rounded-full border border-white/35 bg-black/35 px-4 py-2 text-xs font-semibold tracking-[0.12em] text-white/90 backdrop-blur-sm transition-colors hover:bg-black/50 focus-visible:ring-2 focus-visible:ring-pink-300 focus-visible:outline-none"
          style={{
            right: "max(1rem, env(safe-area-inset-right))",
            bottom: "max(1rem, env(safe-area-inset-bottom))",
          }}
          aria-label={t("skip")}
        >
          {t("skip")}
        </button>
      )}
    </div>
  );
}
