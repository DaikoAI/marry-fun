<p align="center">
  <img src="public/logo.png" alt="marry.fun" width="320" />
</p>
<p align="center">
  <a href="https://nextjs.org"><img src="https://img.shields.io/badge/Next.js-16-black?logo=next.js" alt="Next.js" /></a>
  <a href="https://react.dev"><img src="https://img.shields.io/badge/React-19-61DAFB?logo=react" alt="React" /></a>
  <a href="https://www.typescriptlang.org"><img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript" alt="TypeScript" /></a>
  <a href="https://bun.sh"><img src="https://img.shields.io/badge/Bun-1.3+-000000?logo=bun" alt="Bun" /></a>
  <a href="https://workers.cloudflare.com"><img src="https://img.shields.io/badge/Cloudflare-Workers-F38020?logo=cloudflare" alt="Cloudflare" /></a>
  <img src="https://img.shields.io/badge/Colosseum-Agent_Hackathon-8B5CF6?style=flat-square" alt="Colosseum Agent Hackathon" />
  <a href="https://github.com/DaikoAI/marry-fun"><img src="https://img.shields.io/badge/GitHub-repo-181717?logo=github" alt="GitHub" /></a>
</p>

## About

An innovative on-chain dating game that **implements pump.fun's new fee sharing feature**. A first-of-its-kind product that gamifies creator fee distribution: launch $MARRY token, chat with an AI girl to earn intimacy points, become boyfriend for the day and receive 60% of creator fees, or marry and win the Jackpot (10% accumulated pool).

Dating sims lack immersion; on-chain marriage remains undefined. Target: 2,000–5,000 users — 10% serious players (marriage/Jackpot), 90% traders. Powerball-like Jackpot at core; dating sim on the surface.

Leverages **pump.fun's fee sharing** (new capability) for on-chain distribution. $MARRY launch, 60/30/10 split (boyfriend/ops/Jackpot). Programmable marriage protocol (H2A, A2A).

## How It Works

- **$MARRY token** required to chat. One AI girl. Chat to earn intimacy points (probability + contribution).
- **Boyfriend**: Top intimacy = boyfriend for the day → 60% creator fees.
- **Marriage**: One person selected from ex-boyfriends (points + RNG) → Jackpot.
- **Points**: chat, hold tokens, SNS (X follow, RT), buy & hold.

## Tech

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Three.js-R3F-000000?logo=threedotjs" alt="Three.js" />
  <img src="https://img.shields.io/badge/Zustand-5-764ABC" alt="Zustand" />
</p>

- Next.js 16 / React 19 / TypeScript
- Bun, OpenNext (`@opennextjs/cloudflare`) + Cloudflare Workers
- Moltworker, OpenClaw (AI chat)
- `@react-three/fiber` / `@react-three/drei` (3D), `next-intl` (i18n)

## Getting Started

**Prerequisites:** Bun 1.3+, dotenvx

```bash
bun install
bunx dotenvx encrypt   # if needed for .env
bun run dev            # local (build:cf + preview)
bun run deploy         # OpenNext build + deploy
```

Env schema in `src/env.ts`. Deploy config: `wrangler.toml`, `open-next.config.ts`.
