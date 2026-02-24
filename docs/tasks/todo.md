# TODO

- [x] RED: add failing integration tests for `GET /api/auth/x/link-status`
- [x] RED: add failing unit tests for `SolanaAuthPanel` X button states
- [x] Implement DB schema extension (`xAccount`) and relations
- [x] Generate migration files for new schema
- [x] Implement `GET /api/auth/x/link-status` route + repository
- [x] Update `SolanaAuthPanel` for always-visible X button (wallet-gated)
- [x] Make `StartPageClient` usable at `/` and keep auth panel visible in name/start steps
- [x] Replace `src/app/[locale]/page.tsx` with Start page entry
- [x] Change `src/app/[locale]/start/page.tsx` to permanent redirect to `/{locale}`
- [x] Replace `/start` navigations with `/`
- [x] Remove old top-page-only components and dead references
- [x] Update i18n messages for X connect states
- [x] Update DB docs (`docs/development/db-schema.md`)
- [x] GREEN: make new tests pass
- [x] Run lint/typecheck/tests
- [x] Run post-implementation reviews (`ui-ux-pro-max`, `vercel-react-best-practices`, `web-design-guidelines`)
- [x] Add review summary to this file

## Review Summary

- ui-ux-pro-max: Verified start screen interaction hierarchy after `/` migration and improved control accessibility by adding visible focus styles and status feedback.
- vercel-react-best-practices: Checked client-side auth/X-link logic for unnecessary waterfalls; state refresh is scoped and memoized via `useCallback`, and effects are dependency-safe.
- web-design-guidelines: Fetched latest guideline set and checked changed files. Applied fixes for focus-visible, form metadata (`name` + `autocomplete` + `spellCheck`), and `aria-live` on async error text.

## 2026-02-24 Wallet Sign Rejection Handling

- [x] RED: add a failing unit test for wallet-sign rejection detection in `SolanaAuthPanel`
- [x] GREEN: treat `WalletSignMessageError` user rejection as a canceled flow (no hard error message)
- [x] Run targeted tests for `SolanaAuthPanel`
- [x] Run post-implementation reviews (`ui-ux-pro-max`, `vercel-react-best-practices`, `web-design-guidelines`)
- [x] Add review summary for this task

### Review Summary (Wallet Sign Rejection Handling)

- ui-ux-pro-max: Confirmed error feedback semantics remain accessible (`role="status"` + `aria-live="polite"`), and cancellation now avoids noisy false-error messaging while preserving button state UX.
- vercel-react-best-practices: Verified no new waterfall/rerender regressions; cancellation branch exits early in catch path and keeps existing memoized callback/effect structure intact.
- web-design-guidelines: Checked updated auth panel against latest guide themes (clear labels, explicit control states, resilient error handling); no new guideline violations introduced by this patch.

## 2026-02-24 Top Page BGM Toggle

- [x] RED: add failing unit test for top-page BGM controller placement (top-right)
- [x] GREEN: render `BgmController` on top page and place it at top-right
- [x] Run targeted tests
- [x] Run post-implementation reviews (`ui-ux-pro-max`, `vercel-react-best-practices`, `web-design-guidelines`)
- [x] Add review summary for this task

### Review Summary (Top Page BGM Toggle)

- ui-ux-pro-max: Checked interaction/accessibility heuristics (visible focus, click/tap primary action, touch target sizing). Updated top-right controls to `h-11 w-11` and kept focus ring styling for keyboard users.
- vercel-react-best-practices: Change is UI-only and lightweight (no additional waterfalls, no heavy imports, no new broad effect dependencies). `BgmController` remains a small isolated client component.
- web-design-guidelines: Fetched latest guideline source and reviewed changed files. Confirmed labeled controls (`aria-label`), safe-area-aware top-right placement, and mobile-friendly hit target size.
- Follow-up (user feedback): moved top-page logo lower via safe-area aware top margin to avoid overlap with top-right sound/language controls.

## 2026-02-24 Language Toggle Icon

- [x] Replace `EN / 日本語` buttons with a single globe icon button in the top-right
- [x] Make the globe button toggle locale between `en` and `ja` on click
- [x] Run lint/typecheck for the changed files
- [x] Run post-implementation reviews (`ui-ux-pro-max`, `vercel-react-best-practices`, `web-design-guidelines`)
- [x] Add review summary for this task

### Review Summary (Language Toggle Icon)

- ui-ux-pro-max: Applied icon-only control accessibility guidance by adding a clear `aria-label`, visible focus ring, and consistent icon button interaction (`cursor-pointer` + hover feedback).
- vercel-react-best-practices: Kept changes lightweight and client-safe (no new waterfalls, no added heavy imports, direct `Link` navigation preserved).
- web-design-guidelines: Checked against latest guideline source and ensured the new top-right control follows accessible naming/focus behavior and mobile safe-area placement.
- Follow-up (user feedback): changed from one-click locale toggle to globe-triggered language menu (`EN` / `日本語`) with explicit selection.

## 2026-02-24 Start Screen Auth Panel Sticky Bottom + Connected Labels

- [x] RED: add failing tests for start-page auth panel bottom placement and connected button labels
- [x] GREEN: keep `SolanaAuthPanel` pinned to bottom in all onboarding states
- [x] GREEN: show connected labels in buttons (`..✅`, `@username ✅`)
- [x] Run targeted tests and lint
- [x] Run post-implementation reviews (`ui-ux-pro-max`, `vercel-react-best-practices`, `web-design-guidelines`)
- [x] Add review summary for this task

### Review Summary (Start Screen Auth Panel Sticky Bottom + Connected Labels)

- ui-ux-pro-max: Matched touch-target and spacing guidance (`h-11 w-11`, `gap-2`) and preserved visible focus styles on interactive controls; bottom-sticky auth panel keeps primary action location stable across onboarding states.
- vercel-react-best-practices: Kept logic local and lightweight (no new waterfalls, no expensive render work, no broad effect dependencies). Added pure label-format helpers and reused existing flow.
- web-design-guidelines: Checked latest guideline doc and verified key points for changed files: icon controls keep `aria-label`, focus-visible styles are present, form fields keep labels/metadata, and safe-area/layout handling remains intact.

## 2026-02-24 X Callback Re-Auth + Profile Persistence

- [x] RED: add/update tests for session-pending auto sign-in guard and X profile fields
- [x] GREEN: skip auto wallet signature while auth session is pending/valid after X callback
- [x] GREEN: persist X username and profile image URL to `xAccount`
- [x] GREEN: return persisted X profile data from `/api/auth/x/link-status` and keep `@username` label on connect button
- [x] Update DB schema docs (`docs/development/db-schema.md`) and migration files
- [x] Run targeted tests + typecheck
- [x] Run post-implementation reviews (`ui-ux-pro-max`, `vercel-react-best-practices`, `web-design-guidelines`)
- [x] Add review summary for this task

### Review Summary (X Callback Re-Auth + Profile Persistence)

- ui-ux-pro-max: Applied high-severity UX checks (`Focus States`, `Loading Buttons`, async feedback). `SolanaAuthPanel` keeps visible `focus-visible` rings, loading labels (`connecting` / `signing`), and disabled states during async auth/link operations.
- vercel-react-best-practices: Aligned with rerender/waterfall guidance by gating auto-sign-in with primitive `session.isPending` and parallelizing independent route reads (`hasSvmWallet` + `findTwitterAccountByUserId`) via `Promise.all`.
- web-design-guidelines: Fetched latest guideline set from `vercel-labs/web-interface-guidelines` and reviewed changed UI/API touchpoints; no new guideline violations found in button semantics, async status handling, or auth flow interaction states.

## 2026-02-24 DB Table Naming Snake Case Alignment

- [x] Rename mixed-case auth table names to snake_case (`walletAddress` -> `wallet_address`, `xAccount` -> `x_account`)
- [x] Regenerate migrations cleanly from current schema baseline
- [x] Update DB docs to reflect canonical snake_case table names
- [x] Run targeted tests + typecheck
- [x] Run post-implementation reviews (`ui-ux-pro-max`, `vercel-react-best-practices`, `web-design-guidelines`)
- [x] Add review summary for this task

### Review Summary (DB Table Naming Snake Case Alignment)

- ui-ux-pro-max: No UI component changes in this task; reviewed impact scope and confirmed no visual/accessibility regressions introduced by schema-only updates.
- vercel-react-best-practices: Change was DB schema/migration focused with no new React render paths; no client waterfall or rerender regressions introduced.
- web-design-guidelines: Retrieved latest guideline source and reviewed changed surface area; no guideline-relevant UI changes in this patch.
- Validation notes: integration tests for auth routes passed; `bun run typecheck` currently fails due existing side-effect CSS import resolution errors in [layout.tsx](/Users/asumayamada/Work/daikolabs/marry-fun/src/app/[locale]/layout.tsx:14) and [layout.tsx](/Users/asumayamada/Work/daikolabs/marry-fun/src/app/[locale]/layout.tsx:15), unrelated to this migration rename/regeneration task.

## 2026-02-24 Onboarding Copy After X Connect

- [x] RED: add failing unit test for onboarding copy switch when X is linked
- [x] GREEN: show `you got 300points!` and `stay tune...` instead of `Register to earn points` after X connect
- [x] Run targeted tests + lint/typecheck (typecheck currently fails in existing baseline imports for CSS side-effect modules)
- [x] Run post-implementation reviews (`ui-ux-pro-max`, `vercel-react-best-practices`, `web-design-guidelines`)
- [x] Add review summary for this task

### Review Summary (Onboarding Copy After X Connect)

- ui-ux-pro-max: Verified this keeps onboarding status feedback explicit; linked-X state now shows clear success copy while preserving existing spacing/contrast.
- vercel-react-best-practices: Change is render-only copy branching via a pure helper (`getOnboardingHeadlineCopy`) with no added data fetching, effects, or rerender hotspots.
- web-design-guidelines: Reviewed updated panel content against the latest guideline source (clarity, status communication, accessibility semantics); no new violations introduced in this patch.
