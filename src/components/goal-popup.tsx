"use client";

import { useTranslations } from "next-intl";

import { ModalOverlay, useModalClose } from "./modal-overlay";

function GoalContent() {
  const t = useTranslations("goal");
  const requestClose = useModalClose();

  return (
    <>
      <h2 id="goal-popup-title" className="mb-4 text-center text-lg font-(--font-tokimeki) font-bold text-white">
        {t("title")}
      </h2>
      <ul className="space-y-3 text-sm leading-relaxed text-white/80">
        <li>{t("earnPoints")}</li>
        <li>
          {t("topPlayer")}
          <p className="mt-1 text-xs text-white/50">{t("topPlayerNote")}</p>
        </li>
        <li>
          {t("marriagePrize")}
          <p className="mt-1 text-xs text-white/50">{t("marriagePrizeNote")}</p>
        </li>
      </ul>
      <button
        type="button"
        onClick={requestClose}
        className="mt-5 w-full cursor-pointer rounded-full border border-pink-200/40 bg-pink-500/30 py-2.5 text-sm font-(--font-tokimeki) font-bold text-white backdrop-blur-sm transition-colors hover:bg-pink-500/40 focus-visible:ring-2 focus-visible:ring-pink-300 focus-visible:outline-none"
      >
        {t("confirm")}
      </button>
    </>
  );
}

export function GoalPopup({ onClose }: { onClose: () => void }) {
  return (
    <ModalOverlay onClose={onClose} ariaLabelledBy="goal-popup-title" fadeMs={600} backdropClose={false}>
      <GoalContent />
    </ModalOverlay>
  );
}
