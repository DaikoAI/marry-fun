"use client";

import { useTranslations } from "next-intl";

import { ModalOverlay, useModalClose } from "./modal-overlay";

function HelpContent() {
  const t = useTranslations("help");
  const tGoal = useTranslations("goal");
  const requestClose = useModalClose();

  return (
    <>
      <h2 id="help-modal-title" className="mb-4 text-lg font-(--font-tokimeki) font-bold text-white">
        {t("title")}
      </h2>
      <ul className="space-y-2 text-sm leading-relaxed text-white/80">
        <li>{t("sendMessage")}</li>
        <li>{t("earnFromChat")}</li>
        <li>
          {t("marryBoost")}
          <p className="mt-1 text-xs text-white/50">{t("bonusNote")}</p>
        </li>
      </ul>

      <hr className="my-4 border-pink-200/20" />

      <h3 className="mb-3 text-sm font-(--font-tokimeki) font-bold text-white">{tGoal("title")}</h3>
      <ul className="space-y-2 text-sm leading-relaxed text-white/80">
        <li>{tGoal("earnPoints")}</li>
        <li>
          {tGoal("topPlayer")}
          <p className="mt-1 text-xs text-white/50">{tGoal("topPlayerNote")}</p>
        </li>
        <li>
          {tGoal("marriagePrize")}
          <p className="mt-1 text-xs text-white/50">{tGoal("marriagePrizeNote")}</p>
        </li>
      </ul>
      <button
        type="button"
        onClick={requestClose}
        className="mt-5 w-full cursor-pointer rounded-full border border-pink-200/40 bg-white/10 py-2 text-sm text-white/80 backdrop-blur-sm transition-colors hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-pink-300 focus-visible:outline-none"
      >
        {t("close")}
      </button>
    </>
  );
}

export function HelpModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalOverlay onClose={onClose} ariaLabelledBy="help-modal-title">
      <HelpContent />
    </ModalOverlay>
  );
}
