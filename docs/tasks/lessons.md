# Lessons

- When a request mentions "top" in this project, verify whether it means the legacy home (`/[locale]`) or onboarding (`/[locale]/start`) before finalizing implementation assumptions.
- On the start screen, keep `SolanaAuthPanel` anchored to the bottom across all onboarding states (`wallet`, `name`, `start`) so post-connect transitions do not shift the primary auth controls upward.
- For wallet/X connected states, preserve the same button shells and only swap inner labels (e.g., shortened wallet + `✅`, `@username ✅`) instead of replacing controls with separate text elements.
- For language switching UX requests, confirm whether the user wants one-click toggle or a menu with explicit language choices before finalizing the interaction.
- For UI refinement follow-ups, treat layout direction and iconography details (e.g., vertical tabs, emoji usage) as strict requirements and reflect them exactly.
- When adjusting size parity between adjacent controls, check for per-instance `className` overrides before assuming component defaults are applied.
- For local D1 debugging, verify schema with `wrangler d1 execute ... --local` first; `drizzle-kit studio` can point at a stale `.wrangler` sqlite when multiple files exist.
- Keep DB table names consistently `snake_case` (including auth-related tables): use `wallet_address` and `x_account` instead of mixed-case names.
- When the user specifies exact replacement copy tied to a completion state (e.g., after X link), implement the exact strings and trigger condition directly in that state source instead of adding parallel display logic elsewhere.
- When a user clarifies third-party provider choice after planning (e.g., image generation provider), immediately switch implementation to that provider and keep prompt/config in constants for future edits.
- For DOM APIs like `document.startViewTransition`, avoid unbound method calls; call through `document` (or `Function.prototype.call`) and align feature flags with official Next.js config docs.
- For repeated top-page UI tweaks, keep `BgmController` size aligned with neighboring icon controls (`h-8 w-8`) and lock it with a unit test expectation to prevent regressions.
- For third-party API routes, add request-scoped structured logs (start, validation, external call start/result, failure, duration) so 4xx/5xx root causes are identifiable without reproducing locally.
- When users ask for module-level verification, add direct unit tests for outbound request payloads and storage adapters (not only route-level integration tests).
- For Runware `imageInference` with X profile references, normalize `pbs.twimg.com/profile_images` URLs (`_normal`/`_bigger`/`name=normal`) to `400x400` before request; raw X icon URLs can be below Runware's minimum reference width and cause deterministic 400s.
- When the user provides a reference utility implementation (e.g., shared `r2.ts`), align project code to shared helper interfaces first, then adapt feature modules to call those helpers.
- For top-page UI polish requests, verify readability against bright background regions first and default to layered contrast protection (background dim + content panel), not just per-text color tweaks.
