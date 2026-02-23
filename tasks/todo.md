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
