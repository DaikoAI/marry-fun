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
