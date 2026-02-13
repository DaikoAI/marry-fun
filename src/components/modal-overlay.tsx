"use client";

import { useState, useCallback, useEffect, useRef, createContext, use } from "react";
import type { ReactNode } from "react";

import { useModalA11y } from "@/hooks/use-modal-a11y";

const ModalCloseContext = createContext<(() => void) | null>(null);

/**
 * Hook to get the close function that triggers fade-out animation.
 * Use this in child components instead of calling onClose directly.
 */
export function useModalClose(): () => void {
  const requestClose = use(ModalCloseContext);
  if (!requestClose) {
    throw new Error("useModalClose must be used within ModalOverlay");
  }
  return requestClose;
}

interface ModalOverlayProps {
  onClose: () => void;
  ariaLabelledBy: string;
  children: ReactNode;
  /** Fade-in duration in ms (default 400) */
  fadeMs?: number;
  /** Allow closing by clicking the backdrop (default true) */
  backdropClose?: boolean;
  className?: string;
}

export function ModalOverlay({
  onClose,
  ariaLabelledBy,
  children,
  fadeMs = 400,
  backdropClose = true,
  className,
}: ModalOverlayProps) {
  const [isClosing, setIsClosing] = useState(false);
  const closingRef = useRef(false);

  const handleClose = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    setIsClosing(true);
  }, []);

  const dialogRef = useModalA11y(handleClose);

  const handleAnimationEnd = useCallback(() => {
    if (isClosing) {
      onClose();
    }
  }, [isClosing, onClose]);

  const handleBackdropClick = useCallback(() => {
    if (backdropClose) {
      handleClose();
    }
  }, [backdropClose, handleClose]);

  // Reset closing state when component unmounts and remounts
  useEffect(() => {
    return () => {
      closingRef.current = false;
    };
  }, []);

  const animationName = isClosing ? "fadeOut" : "fadeIn";

  return (
    <ModalCloseContext value={handleClose}>
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center overscroll-contain bg-black/60 backdrop-blur-sm motion-reduce:animate-none`}
        style={{ animation: `${animationName} ${String(fadeMs)}ms cubic-bezier(0.22,1,0.36,1) both` }}
        onClick={handleBackdropClick}
        onAnimationEnd={handleAnimationEnd}
      >
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={ariaLabelledBy}
          className={`mx-4 max-w-sm rounded-2xl border border-pink-200/30 bg-white/15 p-6 backdrop-blur-xl ${className ?? ""}`}
          onClick={e => {
            e.stopPropagation();
          }}
        >
          {children}
        </div>
      </div>
    </ModalCloseContext>
  );
}
