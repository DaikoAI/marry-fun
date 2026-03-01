# TODO

- [x] 2026-03-02 Diagnose X connect failure (`/api/auth/callback/twitter` -> `/api/auth/error`)
- [x] Add structured diagnostics logs for `/api/auth/[...all]` callback/error flow
- [x] Add actionable logs for `/api/auth/x/link-status` and `SolanaAuthPanel` link action
- [x] Configure Better Auth `accountLinking.trustedProviders` to trust `twitter`
- [x] Run targeted tests for auth routes and auth panel
- [x] Run post-implementation reviews (`ui-ux-pro-max`, `vercel-react-best-practices`, `web-design-guidelines`)
- [x] Add review summary with identified root cause

## Review Summary (Diagnose X connect failure)

- ui-ux-pro-max: 既存UX（連携中/エラー文言表示）を維持しつつ、失敗時の次アクション判断に必要な診断ログを追加。UI構造や操作フローの変更なし。
- vercel-react-best-practices: クライアント変更は既存イベントハンドラ内の軽量ログ追加のみで、追加フェッチ・再レンダリング・bundle増大なし。
- web-design-guidelines: 変更範囲に新規UI要素はなく、`button`/focus/aria の既存実装を維持。ガイドライン準拠状態を維持。
- Root cause (identified): 失敗地点は `link-social` 後の Better Auth callback フェーズ（`/api/auth/callback/twitter`）で、`/api/auth/error` へリダイレクトされている。`x-link-status` 側は正常応答しており、DB同期ロジックではなく OAuth callback 側の失敗。callback URL 設定済み前提では、Twitter が `emailVerified` を返さないケースで `accountLinking.trustedProviders` 未設定により `unable_to_link_account` へ落ちる経路が有力で、今回 `trustedProviders: ["twitter"]` を適用。

- [x] 2026-03-02 Fix top-page profile image frame clipping (Tinder-style card gets cropped)
- [x] RED: add failing regression test for top-page profile preview card aspect/fit classes
- [x] GREEN: update profile/ready preview frame sizing to Tinder card ratio and avoid clipping
- [x] Run targeted unit tests for `start-page-client`
- [x] Run post-implementation reviews (`ui-ux-pro-max`, `vercel-react-best-practices`, `web-design-guidelines`)
- [x] Add review summary for this task

## Review Summary (Fix top-page profile image frame clipping)

- ui-ux-pro-max: mobile/responsive観点で縦長カードの固定アスペクト比を推奨。`aspect-[217/367]` と `w-full + max-w` により、狭い画面でもカード比率を維持して見切れを防止。
- vercel-react-best-practices: 変更は表示クラスと回帰テストのみで、データフェッチ/再レンダリング経路やバンドル構成に追加コストなし。
- web-design-guidelines: 変更範囲（プロフィールプレビュー枠）で、フォーカス可能要素やナビゲーション要素のa11y退行はなし。画像 `alt` も維持。

- [x] 2026-03-01 Fix `bun run build:cf` failure (`/_global-error` prerender `useContext` null)
- [x] RED: add failing regression test for build script env behavior (`NODE_ENV=production`)
- [x] Identify concrete root cause (`.env.local` `NODE_ENV=development` leaked into `next build`)
- [x] GREEN: force production mode in `build` script (`NODE_ENV=production dotenvx ... next build`)
- [x] Re-run targeted test + `bun run build:cf` + `bun run preview` boot check
- [x] Run post-implementation reviews (`ui-ux-pro-max`, `vercel-react-best-practices`, `web-design-guidelines`)
- [x] Add review summary for this task

## Review Summary (Fix `build:cf` prerender crash from `NODE_ENV` leak)

- ui-ux-pro-max: No UI surface changed; this patch is package script runtime mode control only.
- vercel-react-best-practices: Build-time env consistency fix only; no React rendering/data-fetch/bundle behavior changed.
- web-design-guidelines: Latest guidelines fetched and checked; changed files (`package.json`, script tests) are non-UI scope so no guideline findings.

- [x] 2026-03-01 Fix `bun run dev` build failure (`start-page-client.tsx` implicit `any`)
- [x] Inspect failing `updateUser(...).then(({ error }) => ...)` callback typing and choose minimal type-safe fix
- [x] Add explicit callback parameter type for `error` binding to satisfy `noImplicitAny`
- [x] Re-run `bun run build:cf:local` and confirm OpenNext/Next.js build success
- [x] Run post-implementation reviews (`ui-ux-pro-max`, `vercel-react-best-practices`, `web-design-guidelines`)
- [x] Add review summary for this task

## Review Summary (Fix `start-page-client.tsx` implicit `any`)

- ui-ux-pro-max: No UI layout/style/interaction path changed; this patch is type-only in a submit handler callback.
- vercel-react-best-practices: No render/data-fetch/perf behavior changed; explicit typing is compile-time only and keeps runtime identical.
- web-design-guidelines: Checked changed scope (`start-page-client.tsx`) and found no guideline-impacting DOM/semantics/accessibility changes.

- [x] 2026-03-01 Bun バージョン更新（repo内固定値の一括引き上げ）
- [x] `bun --version` を基準に更新ターゲットを確定
- [x] `package.json` の `packageManager` を更新
- [x] `.github/workflows/*.yml` の Bun 固定値と検証値を更新
- [x] リポジトリ内の Bun 旧バージョン残存を検索して確認
- [x] Run post-implementation reviews (`ui-ux-pro-max`, `vercel-react-best-practices`, `web-design-guidelines`)
- [x] Add review summary for this task

## Review Summary (Bun バージョン更新)

- ui-ux-pro-max: UI レイヤー（`.tsx`/スタイル）への変更はなく、画面デザイン/UX の退行は発生しない構成。
- vercel-react-best-practices: React/Next.js 実装変更なし。バンドル・レンダリング・データフェッチ経路への影響なし。
- web-design-guidelines: 最新ガイドラインを取得して確認し、今回の変更対象（`package.json` と workflow YAML）は UI ガイドラインの適用対象外で違反なし。

- [x] 2026-02-27 Switch back to pure Runware referenceImages merge (no post-overlay)
- [x] Remove `referenceFaceImageUrl` post-composite projection path
- [x] Keep only model-level reference merge via `inputs.referenceImages`
- [x] Normalize `__normal` X URL to `__400x400` before inference to satisfy width constraints
- [x] Tune prompt using FLUX.2 prompting guide (`Subject+Style+Context`, direct instructions, no negative prompt)
- [x] Validate with script output and ensure `characterRunwareReferenceMode: remote-url`
- [x] Run targeted lint/tests

- [x] 2026-02-27 Enforce guaranteed reference-image reflection on face area
- [x] Confirm provided reference URL content and identify non-human source mismatch
- [x] Add deterministic face-projection layer in Tinder composite (`referenceFaceImageUrl`)
- [x] Fetch and pass reference image data URL from profile-image generate route
- [x] Update debug script to pass reference image into composite output
- [x] Update integration tests for reference projection payload/fetch behavior
- [x] Re-run generation and confirm non-human reference appears on face region
- [x] Run targeted tests/lint
- [x] Run post-implementation reviews (`ui-ux-pro-max`, `vercel-react-best-practices`, `web-design-guidelines`)
- [x] Add review summary for this task

## Review Summary (Guaranteed reference-image reflection on face area)

- ui-ux-pro-max: this update prioritizes deterministic identity/style carry-over by projecting the reference source into the face region, reducing mismatch risk across model variance.
- vercel-react-best-practices: implementation stays server/compositor-side with no extra client rendering complexity or new data-fetch waterfalls.
- web-design-guidelines: overlay remains readable and preserves sample-like bottom metadata hierarchy while removing unintended decorative frame artifacts.

- [x] 2026-02-27 Reference image mismatch + prompt tuning for Runware face consistency
- [x] Verify actual bytes/content of provided X profile URL before assuming it is a face photo
- [x] Tighten Runware profile prompt to prioritize face-identity preservation over metadata tokens
- [x] Update debug script to support local reference image default (`public/sample.png`) and data-URL reference mode
- [x] Re-run generation and confirm improved similarity against provided samples
- [x] Run targeted tests/lint
- [x] Run post-implementation reviews (`ui-ux-pro-max`, `vercel-react-best-practices`, `web-design-guidelines`)
- [x] Add review summary for this task

## Review Summary (Reference image mismatch + prompt tuning)

- ui-ux-pro-max: improved visual consistency by ensuring the right reference source is actually used, resulting in card portraits that match intended identity style.
- vercel-react-best-practices: changes are isolated to prompt/content and debug pipeline behavior; no additional client-side rendering or data-flow complexity introduced.
- web-design-guidelines: preserved clear typography hierarchy and contrast while removing accidental decorative border artifacts and keeping metadata overlays readable.

- [x] 2026-02-27 Tinder profile-card style alignment with sample images (217x367 ratio style)
- [x] RED: reproduce missing inner composite rendering while running profile-composite script
- [x] GREEN: rebuild Tinder composite overlay to show `name / age / university / map + distance` on generated image
- [x] GREEN: keep visible thin Tinder-style frame and cover-fit character image rendering
- [x] GREEN: make profile-image generate route use Runware character output as primary source (no X fallback on character failure)
- [x] GREEN: enrich decorations with `age / university / distance` values and pass to composite
- [x] GREEN: update debug script defaults to provided reference URL and verify runware+composite pipeline
- [x] Validate with repeated script generations against user-provided samples
- [x] Run targeted tests + lint
- [x] Run post-implementation reviews (`ui-ux-pro-max`, `vercel-react-best-practices`, `web-design-guidelines`)
- [x] Add review summary for this task

## Review Summary (Tinder profile-card style alignment with sample images)

- ui-ux-pro-max: shifted composition to a clear Tinder-card hierarchy (thin rounded frame, full-bleed portrait, bottom metadata stack) and tuned typography hierarchy for name/age and secondary profile metadata.
- vercel-react-best-practices: kept changes localized to server composition and route orchestration; no new client data waterfalls or heavy runtime dependencies were introduced.
- web-design-guidelines: verified sample-aligned overlay keeps clear contrast/readability and deterministic metadata placement while preserving existing API surface for callers.

- [x] 2026-02-27 Add composite-only debug script (no client/API path)
- [x] Implement CLI script to run `createTinderProfileCompositeImage` directly with local/URL inputs
- [x] Add package script `test:profile-composite`
- [x] Add unit guard in `package-scripts.test.ts` for script entry
- [x] Validate by generating a real PNG output from script execution
- [x] Run post-implementation reviews (`ui-ux-pro-max`, `vercel-react-best-practices`, `web-design-guidelines`)
- [x] Add review summary for this task

## Review Summary (Add composite-only debug script)

- ui-ux-pro-max: No user-facing UI component was modified; this task adds an offline debug utility for image composition validation.
- vercel-react-best-practices: No React/Next runtime path was altered; script executes outside client lifecycle and avoids rendering/data-flow regressions.
- web-design-guidelines: Latest guideline scope checked; changes are limited to tooling/tests and do not introduce UI guideline issues.

- [x] 2026-02-27 Ensure generated profile image appears on top page reliably
- [x] RED: add failing integration test for background timeout fallback in `POST /api/profile-image/generate`
- [x] GREEN: make Runware background generation non-blocking (fallback on failure/timeout)
- [x] GREEN: fallback to X profile image when character generation times out/fails
- [x] GREEN: support Tinder card layout even when only character image is available
- [x] GREEN: reflect generated `imageUrl` immediately on top page before session refetch completes
- [x] Run targeted tests/lint for profile-image route/start-page/composite
- [x] Run post-implementation reviews (`ui-ux-pro-max`, `vercel-react-best-practices`, `web-design-guidelines`)
- [x] Add review summary for this task

## Review Summary (Ensure generated profile image appears on top page reliably)

- ui-ux-pro-max: Preserved onboarding flow while improving perceived responsiveness by showing generated profile preview immediately and keeping a stable card presentation even when dynamic background generation fails.
- vercel-react-best-practices: Kept changes localized and lightweight (no additional client data waterfall); UI now uses API response data directly for instant feedback while still refetching session for canonical state.
- web-design-guidelines: Pulled latest guideline source and verified changed scope; no new interactive accessibility regressions introduced by this patch.

- [x] 2026-02-26 Profile image background/style mismatch (brick background + missing Tinder frame)
- [x] RED: add failing tests for background prompt direction and frame visibility layout
- [x] GREEN: change Runware background prompt to non-brick abstract bokeh mood
- [x] GREEN: fix Tinder composite frame rendering so border is not hidden by character image
- [x] Run targeted tests for runware profile-image + tinder composite + generate route
- [x] Run post-implementation reviews (`ui-ux-pro-max`, `vercel-react-best-practices`, `web-design-guidelines`)
- [x] Add review summary for this task

## Review Summary (Profile image background/style mismatch)

- ui-ux-pro-max: Updated the generated visual direction from hard-coded rustic brick texture to a softer cinematic bokeh backdrop and restored clear frame hierarchy (outer frame + inner clipped content) for stronger Tinder-like readability.
- vercel-react-best-practices: Change is isolated to prompt constant/compositor utility; no additional client-side fetching, rerender paths, or bundle-heavy dependencies were introduced.
- web-design-guidelines: Pulled latest guideline source and verified changed scope (`lib` + `constants` + tests) has no interactive web UI regressions; this patch affects generated image composition, not DOM control semantics.

- [x] 2026-02-26 Move `R2_PROFILE_IMAGE_PUBLIC_BASE_URL` from npm script inline env to `.env.local`
- [x] Remove inline `--env=R2_PROFILE_IMAGE_PUBLIC_BASE_URL=...` from `package.json` preview script
- [x] Add `R2_PROFILE_IMAGE_PUBLIC_BASE_URL` to `.env.local`
- [x] Validate package formatting and env presence
- [x] Run post-implementation reviews (`ui-ux-pro-max`, `vercel-react-best-practices`, `web-design-guidelines`)
- [x] Add review summary for this task

## Review Summary (Move R2 public base URL config to `.env.local`)

- ui-ux-pro-max: No UI code was changed; config-only update has no visual or interaction impact.
- vercel-react-best-practices: No React/Next rendering or data-fetch path changed; runtime behavior is unaffected except env sourcing location.
- web-design-guidelines: Pulled latest guideline source and confirmed changed files are config/task docs only, so no UI guideline findings.

- [x] 2026-02-26 Runware transient 400 inference error (`/api/profile-image/generate` -> 502)
- [x] RED: add failing unit test for transient Runware 400 retry behavior
- [x] GREEN: retry transient Runware inference failures before surfacing error
- [x] Run targeted tests for runware profile-image lib + generate route
- [x] Run post-implementation reviews (`ui-ux-pro-max`, `vercel-react-best-practices`, `web-design-guidelines`)
- [x] Add review summary for this task

## Review Summary (Runware transient 400 inference error)

- ui-ux-pro-max: No UI component/layout changes in this patch; behavior update is server-side retry logic only.
- vercel-react-best-practices: No React/Next rendering/data-fetch paths were added or changed; impact is isolated to server-side Runware adapter resilience.
- web-design-guidelines: Pulled latest guidelines and checked touched scope; only server/lib/test files changed, so there are no UI-guideline findings for this task.

- [x] 2026-02-26 GitHub Actions `setup-bun` fetch failure
- [x] Identify root cause from workflow/action usage and choose minimal robust fix
- [x] Replace failing Bun setup path in all affected workflows
- [x] Validate workflow YAML + command correctness locally
- [x] Run post-implementation reviews (`ui-ux-pro-max`, `vercel-react-best-practices`, `web-design-guidelines`)
- [x] Add review summary for this task

## Review Summary (GitHub Actions `setup-bun` fetch failure)

- ui-ux-pro-max: No UI surface/files changed in this patch; workflow-only change does not affect layout, interaction, or accessibility presentation.
- vercel-react-best-practices: No React/Next runtime code changed; no new client/server render paths, data fetching, or bundle impact introduced.
- web-design-guidelines: Pulled latest guidelines and re-checked changed scope; only `.github/workflows/*.yml` were modified, so no guideline-relevant UI findings.

- [x] 2026-02-26 Local Wrangler Dev + Local R2 Upload/Display + Client Logs
- [x] RED: add/update tests to cover new local dev script behavior and client logging touchpoints
- [x] GREEN: switch `bun run dev` to Wrangler-based local flow (no plain `next dev`)
- [x] GREEN: ensure local preview/build load `.env.local` (avoid `.env.production` for local run)
- [x] GREEN: inject local `R2_PROFILE_IMAGE_PUBLIC_BASE_URL` for local object display
- [x] GREEN: add client-side logs for profile image generate/display flow
- [x] Run targeted tests/lint
- [x] Run post-implementation reviews (`ui-ux-pro-max`, `vercel-react-best-practices`, `web-design-guidelines`)
- [x] Add review summary for this task

## Review Summary (Local Wrangler Dev + Local R2 Upload/Display + Client Logs)

- ui-ux-pro-max: Onboarding UI structure remains unchanged; added logs do not alter interactive hierarchy or visual affordances, and profile preview success/failure states are now observable in client logs.
- vercel-react-best-practices: Kept client behavior lightweight (no new fetch waterfall, no broad effect dependencies). Logging was scoped to existing async handlers and image events only.
- web-design-guidelines: Pulled latest guidelines and re-checked touched UI file; icon buttons keep `aria-label`, form metadata remains intact, and profile preview images keep `alt` text without introducing new guideline violations.

- [x] 2026-02-26 Profile Image Black Render Fix + Browser Verification
- [x] RED: add failing integration assertion for data URL conversion in profile-image generate route
- [x] GREEN: fetch Runware images and pass data URLs to OG composite renderer
- [x] Switch Runware output format from WEBP to PNG for OG compatibility
- [x] Run targeted lint on changed files
- [x] Run targeted tests for profile-image route and Runware client
- [x] Verify rendered composite is not black via browser automation
- [x] Run post-implementation reviews (`ui-ux-pro-max`, `vercel-react-best-practices`, `web-design-guidelines`)
- [x] Add review summary for this task

## Review Summary (Profile Image Black Render Fix + Browser Verification)

- ui-ux-pro-max: Confirmed profile preview remains visible with existing action hierarchy; no additional visual regressions introduced in top-page profile display flow.
- vercel-react-best-practices: Kept the fix server-side and minimal (single conversion step before composite), preserving existing client rendering/data-fetch boundaries.
- web-design-guidelines: UI surface unchanged in this patch; validated current top-page controls/accessibility patterns remain compliant after backend image pipeline update.

- [x] 2026-02-26 Profile Image R2 Direct URL + Top Page Display
- [x] Remove profile-image API proxy URL fallback and use R2 public URL directly
- [x] Update profile-image generate route/tests to stop passing `requestOrigin`
- [x] Show generated profile image on top page after generation
- [x] Run targeted tests for storage route/start-page
- [x] Run post-implementation reviews (`ui-ux-pro-max`, `vercel-react-best-practices`, `web-design-guidelines`)
- [x] Add review summary for this task

## Review Summary (Profile Image R2 Direct URL + Top Page Display)

- ui-ux-pro-max: Confirmed generated profile image remains visible in onboarding completion (`ready`) so users can verify result before starting gameplay; async action buttons keep disabled/loading behavior.
- vercel-react-best-practices: Kept changes lightweight (no new fetch waterfalls, no broad effect dependencies), and constrained UI change to existing client component branch rendering.
- web-design-guidelines: Checked updated start page against latest rules (icon button labels/focus-visible, form metadata, safe-area placement). No new blocking guideline violations introduced by this patch.

- [x] 2026-02-26 Top Page Text Readability Improvements
- [x] Improve top background readability baseline (overlay/contrast)
- [x] Make onboarding copy areas consistently readable in all phases
- [x] Tune top-right controls (language/BGM) contrast and visibility
- [x] Run targeted tests for start page
- [x] Run post-implementation reviews (`ui-ux-pro-max`, `vercel-react-best-practices`, `web-design-guidelines`)
- [x] Add review summary for this task

## Review Summary (Top Page Text Readability Improvements)

- ui-ux-pro-max: Applied contrast/readability guidance by adding a top-only background dim/gradient layer, unifying onboarding copy into a protected glass panel, and strengthening control contrast without changing interaction flow.
- vercel-react-best-practices: Kept this patch purely presentational (no new data fetching/effects, no broader subscriptions), while preserving component boundaries (`Background` + `StartPageClient`) and existing render behavior.
- web-design-guidelines: Pulled latest guideline source and reviewed changed files; icon buttons retain `aria-label` and focus-visible rings, form accessibility attributes remain present, and safe-area-aware top control placement is preserved.

- [x] 2026-02-24 Fix `bun run build:cf && bun run preview` failure
- [x] RED: add failing regression test for chat page server prerender safety
- [x] GREEN: make chat page render path compatible with Next.js build prerender
- [x] Run `bun run build:cf`
- [x] Run `bun run preview` boot check
- [x] Run post-implementation reviews (`ui-ux-pro-max`, `vercel-react-best-practices`, `web-design-guidelines`)
- [x] Add review summary for this task

## Review Summary (Build/Preview Failure Fix)

- ui-ux-pro-max: Added explicit keyboard focus styles on new global error retry actions, keeping fallback UI interaction discoverable and accessible in both root/locale error boundaries.
- vercel-react-best-practices: Marked `/[locale]/chat` as `force-dynamic` to avoid invalid build-time prerendering of client/store-driven chat state while keeping runtime rendering intact.
- web-design-guidelines: Checked updated UI files against current guidelines (interactive focus state visibility, clear fallback copy, semantic button usage); no blocking findings remain in changed files.

- [x] 2026-02-24 Fix start-page sound button size regression (`h-11` -> compact)
- [x] RED: update `start-page-client` test to expect compact sound button size
- [x] GREEN: remove oversized class override from start-page `BgmController`
- [x] Run targeted test for `start-page-client`
- [x] Run post-implementation reviews (`ui-ux-pro-max`, `vercel-react-best-practices`, `web-design-guidelines`)
- [x] Add review summary for this task

## Review Summary (Sound Button Size Regression)

- ui-ux-pro-max: Re-checked icon-button guidance; top-right controls now share consistent compact sizing (`h-8 w-8`) with visible focus states and no layout-shift interaction changes.
- vercel-react-best-practices: Change is presentational only (single class override adjustment) and keeps component isolation intact; no new data fetching, effects, or render hotspots.
- web-design-guidelines: Reviewed updated start-page control code against latest guideline source; icon controls keep accessible labels and keyboard focus rings, with safe-area top-right placement preserved.

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

## Review Summary (Wallet Sign Rejection Handling)

- ui-ux-pro-max: Confirmed error feedback semantics remain accessible (`role="status"` + `aria-live="polite"`), and cancellation now avoids noisy false-error messaging while preserving button state UX.
- vercel-react-best-practices: Verified no new waterfall/rerender regressions; cancellation branch exits early in catch path and keeps existing memoized callback/effect structure intact.
- web-design-guidelines: Checked updated auth panel against latest guide themes (clear labels, explicit control states, resilient error handling); no new guideline violations introduced by this patch.

## 2026-02-24 Top Page BGM Toggle

- [x] RED: add failing unit test for top-page BGM controller placement (top-right)
- [x] GREEN: render `BgmController` on top page and place it at top-right
- [x] Run targeted tests
- [x] Run post-implementation reviews (`ui-ux-pro-max`, `vercel-react-best-practices`, `web-design-guidelines`)
- [x] Add review summary for this task

## Review Summary (Top Page BGM Toggle)

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

## Review Summary (Language Toggle Icon)

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

## Review Summary (Start Screen Auth Panel Sticky Bottom + Connected Labels)

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

## Review Summary (X Callback Re-Auth + Profile Persistence)

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

## Review Summary (DB Table Naming Snake Case Alignment)

- ui-ux-pro-max: No UI component changes in this task; reviewed impact scope and confirmed no visual/accessibility regressions introduced by schema-only updates.
- vercel-react-best-practices: Change was DB schema/migration focused with no new React render paths; no client waterfall or rerender regressions introduced.
- web-design-guidelines: Retrieved latest guideline source and reviewed changed surface area; no guideline-relevant UI changes in this patch.
- Validation notes: integration tests for auth routes passed; `bun run typecheck` currently fails due existing side-effect CSS import resolution errors in `src/app/[locale]/layout.tsx:14` and `src/app/[locale]/layout.tsx:15`, unrelated to this migration rename/regeneration task.

## 2026-02-24 Onboarding Copy After X Connect

- [x] RED: add failing unit test for onboarding copy switch when X is linked
- [x] GREEN: show `you got 300points!` and `stay tune...` instead of `Register to earn points` after X connect
- [x] Run targeted tests + lint/typecheck (typecheck currently fails in existing baseline imports for CSS side-effect modules)
- [x] Run post-implementation reviews (`ui-ux-pro-max`, `vercel-react-best-practices`, `web-design-guidelines`)
- [x] Add review summary for this task

## Review Summary (Onboarding Copy After X Connect)

- ui-ux-pro-max: Verified this keeps onboarding status feedback explicit; linked-X state now shows clear success copy while preserving existing spacing/contrast.
- vercel-react-best-practices: Change is render-only copy branching via a pure helper (`getOnboardingHeadlineCopy`) with no added data fetching, effects, or rerender hotspots.
- web-design-guidelines: Reviewed updated panel content against the latest guideline source (clarity, status communication, accessibility semantics); no new violations introduced in this patch.

## 2026-02-24 Top Page 3-Phase + Runware Profile Share

- [x] RED: add failing unit tests for new onboarding phase resolver (`connect` / `username` / `profile` / `ready`)
- [x] RED: add failing integration tests for `POST /api/profile-image/generate`
- [x] RED: add failing tests for profile share token + OG helpers
- [x] Add Runware env + client utility and prompt constants
- [x] Implement profile image generation API route (Runware -> `user.image`)
- [x] Implement profile share token route + OG page/image endpoints
- [x] Refactor `StartPageClient` to 3-phase flow with view transitions and resume
- [x] Update i18n messages for new phase labels/buttons/errors
- [x] GREEN: run targeted tests and fix regressions
- [x] Run post-implementation reviews (`ui-ux-pro-max`, `vercel-react-best-practices`, `web-design-guidelines`)
- [x] Add review summary for this task

## Review Summary (Top Page 3-Phase + Runware Profile Share)

- ui-ux-pro-max: Applied onboarding and form UX checks (status clarity, focus-visible controls, async feedback); phase cards keep clear progression and mobile-safe spacing while preserving fixed bottom auth controls.
- vercel-react-best-practices: Kept data reads localized and lightweight (session + `/api/auth/x/link-status`), no heavy client dependencies added, and API responsibilities split into focused routes (`generate`, `share-token`, `og`).
- web-design-guidelines: Fetched latest guideline source (`vercel-labs/web-interface-guidelines`) and reviewed touched UI routes/components; interactive elements keep labels/focus rings, async errors are surfaced, and share surface uses explicit metadata paths.

## 2026-02-24 ViewTransition Illegal Invocation Fix

- [x] Add task plan/checklist for this fix
- [x] RED: add regression test for `startViewTransition` invocation context binding
- [x] GREEN: refactor transition invocation to preserve `document` binding (no illegal invocation)
- [x] Align `next.config.ts` with Next.js `experimental.viewTransition` docs
- [x] Run targeted tests
- [x] Run post-implementation reviews (`ui-ux-pro-max`, `vercel-react-best-practices`, `web-design-guidelines`)
- [x] Add review summary for this task

## Review Summary (ViewTransition Illegal Invocation Fix)

- ui-ux-pro-max: Confirmed the onboarding phase animation path now degrades safely (transition API unavailable -> immediate update), avoiding broken UX while keeping motion behavior intact.
- vercel-react-best-practices: Kept the effect dependency surface narrow (`displayOnboardingPhase`, `onboardingPhase`) and isolated transition invocation in a small helper for stable client rendering behavior.
- web-design-guidelines: Retrieved the latest guideline source and reviewed touched UI code path; no new semantic/accessibility violations introduced by this fix.

## 2026-02-24 Runware 400 During Profile Image Generation

- [x] RED: add/update unit test to assert Runware payload uses `imageInference` + `runware:400@1` compatible shape
- [x] GREEN: switch profile image generation request from `photoMaker` payload to `imageInference` payload (`inputs.referenceImages`)
- [x] GREEN: set Runware default model to `runware:400@1` and keep env override support
- [x] Run targeted unit + integration tests for profile-image generation route/lib
- [x] Run post-implementation reviews (`ui-ux-pro-max`, `vercel-react-best-practices`, `web-design-guidelines`)
- [x] Add review summary for this task

## Review Summary (Runware 400 During Profile Image Generation)

- ui-ux-pro-max: No UI layer changes in this patch; reviewed impact scope and confirmed no visual or interaction regressions are introduced.
- vercel-react-best-practices: API/image-generation flow remains minimal and dependency-safe; the fix only changes provider payload shape and default model while preserving existing request lifecycle and fallback behavior.
- web-design-guidelines: Pulled latest `web-interface-guidelines` source (`command.md`) and checked touched surface; no UI guideline findings because this task only modified server constants/lib/tests.

## 2026-02-24 Runware Reference Image Width 400 Fix

- [x] RED: add failing unit tests for X profile image URL normalization (`_normal` / `name=normal`)
- [x] GREEN: normalize `pbs.twimg.com/profile_images` reference URL to 400x400 variant before Runware request
- [x] Run targeted tests for runware profile-image lib + generation route
- [x] Run post-implementation reviews (`ui-ux-pro-max`, `vercel-react-best-practices`, `web-design-guidelines`)
- [x] Add review summary for this task

## Review Summary (Runware Reference Image Width 400 Fix)

- ui-ux-pro-max: No UI component/layout changes in this fix; verified impact is server-side request shaping only with no UX regressions.
- vercel-react-best-practices: Updated logic stays in server utility scope, keeps API flow simple, and avoids additional client-side fetch/render work.
- web-design-guidelines: Pulled latest guideline source and reviewed touched scope; this patch changes only runware constants/lib/tests, so no UI guideline findings.

## 2026-02-24 R2 Profile Image Path + Public URL Fallback

- [x] RED: update storage tests for `profile-image/` key prefix and missing-public-base fallback
- [x] GREEN: change R2 object key prefix from `profile-images/` to `profile-image/`
- [x] GREEN: support fallback URL generation via `requestOrigin` when `R2_PROFILE_IMAGE_PUBLIC_BASE_URL` is not configured
- [x] GREEN: add public read route `/api/profile-image/object/[...key]` backed by `PROFILE_IMAGES_BUCKET`
- [x] GREEN: pass request origin from `POST /api/profile-image/generate` to R2 uploader
- [x] Run targeted tests + lint + typecheck
- [x] Run post-implementation reviews (`ui-ux-pro-max`, `vercel-react-best-practices`, `web-design-guidelines`)
- [x] Add review summary for this task

## Review Summary (R2 Profile Image Path + Public URL Fallback)

- ui-ux-pro-max: No UI component changes; this update is storage and API plumbing only, so visual/accessibility behavior remains unchanged.
- vercel-react-best-practices: Kept server flow simple by adding a single origin fallback path and a focused R2 object read route, without introducing new client waterfalls.
- web-design-guidelines: Pulled latest guideline source and checked touched scope; no guideline findings because only backend routes/storage/tests were modified.

## 2026-02-24 Tinder Composite + R2 Persist for Profile Image

- [x] Implement Tinder-style composite image renderer as reusable server module
- [x] Implement R2 upload module for profile composite images
- [x] Wire `/api/profile-image/generate` to Runware -> composite -> R2 -> DB (`user.image`)
- [x] Update share metadata path to prefer saved composite image URL
- [x] Add/Update integration and unit tests for route + R2 storage module
- [x] Run targeted tests + lint + typecheck

## 2026-02-24 R2 Helper Alignment (`doom-index` style)

- [x] Introduce reusable `src/lib/r2.ts` helpers (`joinR2Key`, context/bucket resolve, image put/get wrappers)
- [x] Refactor profile-image storage adapter to consume `src/lib/r2.ts` helpers
- [x] Add fallback support for both bucket bindings (`PROFILE_IMAGES_BUCKET` and `R2_BUCKET`)
- [x] Update object proxy route to use shared R2 get helper
- [x] Update Wrangler bindings with `R2_BUCKET` alias for compatibility
- [x] Run targeted tests + lint + typecheck

## 2026-02-26 Web3 SVM Verify `Domain not allowed` Fix

- [x] RED: add failing unit tests for web3 auth domain resolution (`origin`/`host`/fallback)
- [x] GREEN: allow request-aware domain selection for Better Auth web3 plugin (with allowlist)
- [x] GREEN: wire auth route handlers to pass request context into auth builder
- [x] Run targeted tests for new domain resolution behavior
- [x] Run post-implementation reviews (`ui-ux-pro-max`, `vercel-react-best-practices`, `web-design-guidelines`)
- [x] Add review summary for this task

## Review Summary (Web3 SVM Verify Domain Handling)

- ui-ux-pro-max: No UI layer changes in this task; reviewed impact scope and confirmed no layout/interaction/accessibility regressions.
- vercel-react-best-practices: Kept route/auth changes minimal and request-scoped (no client bundle impact, no new waterfalls), with pure helper extraction for deterministic domain resolution.
- web-design-guidelines: Fetched latest guideline source and reviewed changed surface; no guideline violations introduced because updates are server/auth utility focused.

## 2026-02-26 Auth Domain Constants Extraction

- [x] Extract auth/web3 domain lists into constants module
- [x] Replace hardcoded domains in auth and web3-domain utilities
- [x] Run targeted tests and lint/typecheck
- [x] Run post-implementation reviews (`ui-ux-pro-max`, `vercel-react-best-practices`, `web-design-guidelines`)
- [x] Add review summary for this task

## Review Summary (Auth Domain Constants Extraction)

- ui-ux-pro-max: No UI changes in this task; reviewed scope and confirmed no visual/interaction impact.
- vercel-react-best-practices: Refactor is server/constants-only and preserves current request flow without adding render or fetch overhead.
- web-design-guidelines: No guideline-relevant surface change (non-UI patch); no new findings.

## 2026-02-26 Final Check (lint / format / typecheck)

- [x] Run `bun run lint` and confirm zero errors/warnings
- [x] Run `bun run format` and confirm zero errors/warnings
- [x] Run `bun run typecheck` and confirm zero errors/warnings
- [x] If any issue appears, fix the root cause with minimal changes and rerun all checks
- [x] Add review summary for this task

## Review Summary (Final Check lint / format / typecheck)

- ui-ux-pro-max: This patch only resolves lint-rule compatibility in server-side OG image composition (`next/og`) and does not alter interactive UI flows or visual hierarchy.
- vercel-react-best-practices: Renamed a non-hook helper and fixed a strict template-expression type issue; no new client data-fetch, bundle, or rerender risk introduced.
- web-design-guidelines: Fetched latest guideline source and reviewed `src/lib/profile-image/tinder-composite.tsx`; no new web-interface guideline violations in user-facing UI surfaces.
