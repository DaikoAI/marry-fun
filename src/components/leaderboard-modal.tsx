"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";

import type { LeaderboardResponse } from "@/interfaces/schemas/points";
import { leaderboardResponseSchema } from "@/interfaces/schemas/points";

import { ModalOverlay, useModalClose } from "./modal-overlay";

type LeaderboardTab = "total" | "daily";

function RankSection({
  title,
  entries,
  emptyMessage,
}: {
  title: string;
  entries: LeaderboardResponse["total"];
  emptyMessage: string;
}) {
  return (
    <section className="rounded-xl border border-pink-200/25 bg-white/5 p-3">
      <h3 className="mb-2 text-xs tracking-wider text-white/70 uppercase">{title}</h3>
      {entries.length === 0 ?
        <p className="py-4 text-center text-xs text-white/60">{emptyMessage}</p>
      : <ol className="max-h-72 space-y-1.5 overflow-y-auto pr-1">
          {entries.map(entry => (
            <li key={entry.userId} className="grid grid-cols-[2rem_1fr_auto] items-center gap-2 text-sm">
              <span className="text-center font-semibold text-yellow-200/90">#{entry.rank}</span>
              <span className="truncate text-white/85">{entry.displayName}</span>
              <span className="font-semibold text-white tabular-nums">{entry.points.toLocaleString()}</span>
            </li>
          ))}
        </ol>
      }
    </section>
  );
}

function LeaderboardContent() {
  const t = useTranslations("chat.header");
  const requestClose = useModalClose();
  const [activeTab, setActiveTab] = useState<LeaderboardTab>("total");

  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: async ({ signal }) => {
      const res = await fetch("/api/leaderboard", {
        method: "GET",
        cache: "no-store",
        signal,
      });
      const payload: unknown = await res.json();
      if (!res.ok) {
        throw new Error(
          payload && typeof payload === "object" && "message" in payload ?
            (payload.message as string)
          : "Failed to load leaderboard",
        );
      }
      const parsed = leaderboardResponseSchema.safeParse(payload);
      if (!parsed.success) {
        throw new Error("Invalid leaderboard response");
      }
      return parsed.data;
    },
    staleTime: 30 * 1000,
  });

  const tabEntries = activeTab === "total" ? (data?.total ?? []) : (data?.daily ?? []);
  const tabTitle = activeTab === "total" ? t("leaderboardTotalLabel") : t("leaderboardDailyLabel");

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

      {isPending ?
        <p className="py-8 text-center text-sm text-white/60">{t("leaderboardLoading")}</p>
      : isError ?
        <div className="py-4">
          <p className="text-center text-sm text-red-200">{t("leaderboardError")}</p>
          <p className="mt-1 text-center text-xs text-white/60">
            {error instanceof Error ? error.message : t("leaderboardError")}
          </p>
          <button
            type="button"
            onClick={() => {
              void refetch();
            }}
            className="mt-3 w-full cursor-pointer rounded-full border border-pink-200/40 bg-white/10 py-2 text-sm text-white/80 backdrop-blur-sm transition-colors hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-pink-300 focus-visible:outline-none"
          >
            {t("leaderboardRetry")}
          </button>
        </div>
      : <div className="space-y-3">
          <div
            role="tablist"
            aria-label={t("leaderboardTitle")}
            className="relative grid grid-cols-2 rounded-full border border-pink-200/30 bg-white/5 p-1"
          >
            <span
              aria-hidden="true"
              className={`pointer-events-none absolute top-1 bottom-1 rounded-full bg-white/20 ring-1 ring-pink-200/40 transition-transform duration-250 ease-out motion-reduce:transition-none ${
                activeTab === "total" ? "translate-x-0" : "translate-x-full"
              }`}
              style={{ left: "0.25rem", width: "calc(50% - 0.25rem)" }}
            />
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "total"}
              aria-controls="leaderboard-panel"
              onClick={() => {
                setActiveTab("total");
              }}
              className={`relative z-10 cursor-pointer rounded-full px-3 py-1.5 text-xs font-semibold tracking-wide transition-colors ${
                activeTab === "total" ? "text-white" : "text-white/60 hover:bg-white/10 hover:text-white/85"
              }`}
            >
              {t("leaderboardTotalLabel")}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "daily"}
              aria-controls="leaderboard-panel"
              onClick={() => {
                setActiveTab("daily");
              }}
              className={`relative z-10 cursor-pointer rounded-full px-3 py-1.5 text-xs font-semibold tracking-wide transition-colors ${
                activeTab === "daily" ? "text-white" : "text-white/60 hover:bg-white/10 hover:text-white/85"
              }`}
            >
              {t("leaderboardDailyLabel")}
            </button>
          </div>

          <div
            key={activeTab}
            id="leaderboard-panel"
            role="tabpanel"
            className="animate-[fadeIn_220ms_cubic-bezier(0.22,1,0.36,1)_both] motion-reduce:animate-none"
          >
            <RankSection title={tabTitle} entries={tabEntries} emptyMessage={t("leaderboardEmpty")} />
          </div>

          {activeTab === "daily" && (
            <p className="text-center text-[11px] text-white/45">{t("leaderboardDailyWindow")}</p>
          )}
        </div>
      }

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
