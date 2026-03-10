"use client";

import { useState } from "react";

import { HelpModal } from "./help-modal";
import { PumpFunIcon } from "./icons/pump-fun-icon";

export function FooterLinks() {
  const [showHelp, setShowHelp] = useState(false);

  return (
    <>
      <footer className="flex flex-col items-center justify-between gap-3 pb-1 text-sm text-white/90 sm:flex-row">
        <nav aria-label="footer links" className="flex items-center gap-2">
          <a
            href="#"
            aria-label="X (Twitter)"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white/70 ring-1 ring-white/20 backdrop-blur-md transition hover:bg-white/20 hover:text-white"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </a>

          <span
            aria-label="pump.fun (coming soon)"
            aria-disabled="true"
            className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/35 ring-1 ring-white/10 backdrop-blur-md"
          >
            <PumpFunIcon className="h-5 w-5" />
            <span className="pointer-events-none absolute h-px w-7 rotate-[-35deg] bg-white/75" aria-hidden="true" />
          </span>

          <button
            type="button"
            aria-label="Game Rules"
            onClick={() => {
              setShowHelp(true);
            }}
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white/15 text-white/70 ring-1 ring-white/20 backdrop-blur-md transition hover:bg-white/20 hover:text-white focus-visible:ring-2 focus-visible:ring-pink-300 focus-visible:outline-none"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
              <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
            </svg>
          </button>
        </nav>
      </footer>

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
