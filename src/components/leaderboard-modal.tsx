"use client";

import { useTranslations } from "next-intl";

import { ModalOverlay, useModalClose } from "./modal-overlay";

function LeaderboardContent() {
  const t = useTranslations("chat.header");
  const requestClose = useModalClose();

  return (
    <>
      <h2
        id="leaderboard-title"
        className="mb-6 flex items-center justify-center gap-2 text-lg font-(--font-tokimeki) font-bold text-white"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-yellow-300" aria-hidden="true">
          <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z" />
        </svg>
        {t("leaderboardTitle")}
      </h2>

      <p className="py-8 text-center text-sm text-white/60">{t("leaderboardComingSoon")}</p>

      <button
        type="button"
        onClick={requestClose}
        className="mt-2 w-full cursor-pointer rounded-full border border-pink-200/40 bg-white/10 py-2 text-sm text-white/80 backdrop-blur-sm transition-colors hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-pink-300 focus-visible:outline-none"
      >
        {t("leaderboardClose")}
      </button>
    </>
  );
}

export function LeaderboardModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalOverlay onClose={onClose} ariaLabelledBy="leaderboard-title" className="w-full">
      <LeaderboardContent />
    </ModalOverlay>
  );
}
