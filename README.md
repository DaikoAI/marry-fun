<p align="center">
  <img src="public/logo.png" alt="marry.fun" width="320" />
</p>
<p align="center">
  <a href="https://nextjs.org"><img src="https://img.shields.io/badge/Next.js-16-black?logo=next.js" alt="Next.js" /></a>
  <a href="https://react.dev"><img src="https://img.shields.io/badge/React-19-61DAFB?logo=react" alt="React" /></a>
  <a href="https://www.typescriptlang.org"><img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript" alt="TypeScript" /></a>
  <a href="https://bun.sh"><img src="https://img.shields.io/badge/Bun-1.3+-000000?logo=bun" alt="Bun" /></a>
  <a href="https://workers.cloudflare.com"><img src="https://img.shields.io/badge/Cloudflare-Workers-F38020?logo=cloudflare" alt="Cloudflare" /></a>
  <img src="https://img.shields.io/badge/pump.fun-Fee_Sharing-00D4AA?style=flat-square" alt="pump.fun Fee Sharing" />
  <img src="https://img.shields.io/badge/Colosseum-Agent_Hackathon-8B5CF6?style=flat-square" alt="Colosseum Agent Hackathon" />
  <a href="https://github.com/DaikoAI/marry-fun"><img src="https://img.shields.io/badge/GitHub-repo-181717?logo=github" alt="GitHub" /></a>
</p>

## About

`marry.fun` is an **on-chain romance game** with **pump.fun fee sharing** integration.  
It connects narrative IP with token liquidity in the AI video era, turning “shareable memes” into “tradable assets.”

Core experience:

- Launch `$MARRY` and trade on Solana from day one
- Chat with AI girls to earn intimacy points
- That day’s Boyfriend receives 60% of creator fees
- A Husband is chosen and wins the Jackpot (10% of the accumulated pool)

## Problem Statement

Meme coins are storytelling, but as AI drastically lowers the cost of high-quality content creation, capital formation and attention retention mechanisms are lagging behind.  
Degen traders keep hunting for the next narrative, yet there’s a gap between rich storytelling and token liquidity.  
`marry.fun` bridges this gap by turning viral AI narratives into liquid, tradable assets.

## How It Works

- **$MARRY token**: Required to participate in chat. Talk to one AI girl and earn intimacy points.
- **Boyfriend**: Daily selection of the top intimacy user; they receive 60% of creator fees.
- **Marriage**: Husband chosen from former Boyfriends via points + RNG; they receive the Jackpot.
- **Points**: Earned from chat, token holdings, SNS (X follow/RT), buy & hold.

## Technical Approach

- **Token Launch**: Launch `$MARRY` on Solana for free trading from day one.
- **Creator Fee Sharing**: Fee-sharing smart contract built on the `pump.fun` model to accrue and distribute trading fees.
- **Narrative-Linked Claims**: Story winners (Husband) can directly claim accrued creator fees.
- **AI x Onchain Infra**: Connect AI agent prompt design with on-chain implementation to sync story progress with financial incentives.

## Target Audience

- **GenAI-native video creators (X)**: Capable of viral, AAA-style trailers but lacking traditional monetization paths.
- **Solana degen traders**: Early participants seeking high-lore tokens and betting on attention economy winners.

## Business Model

- **Transaction Fees**: 0.5% fee per platform transaction (following the pump.fun model).
- **AI Tool Revenue**: Usage-based pricing for creator-facing AI video generation and agent tools.
- **Creator Fee Pool Share**: Monetize a share of the creator fee pool and reinvest in next-gen AI story production.

## Competitive Landscape

- **vs. Zora / 10k**: Rather than building new social islands, we focus on X-native distribution on existing attention.
- **vs. Story Protocol**: Instead of legal and L1-heavy design, we use Solana’s DeFi composability for instant liquidity and entertainment.

We emphasize making IP not only registrable but also **tradable and fun**.

## Future Vision

After `$MARRY` succeeds, we aim to open the `AI Superpower` studio tools to all creators, enabling permissionless, instant tokenization of any narrative.  
Long term, we target community-led, token-governed IP licensing and value sharing across games, merchandise, and media.

## Tech

<p align="center">
  <img src="https://img.shields.io/badge/pump.fun-Fee_Sharing-00D4AA?style=flat-square" alt="pump.fun Fee Sharing" />
  <img src="https://img.shields.io/badge/Next.js-16-black?logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Three.js-R3F-000000?logo=threedotjs" alt="Three.js" />
  <img src="https://img.shields.io/badge/Zustand-5-764ABC" alt="Zustand" />
</p>

- **Core**: Creator fee distribution (Boyfriend/Husband claims) built on pump.fun fee sharing
- Next.js 16 / React 19 / TypeScript
- Bun, OpenNext (`@opennextjs/cloudflare`) + Cloudflare Workers
- Solana smart contract + fee-sharing distribution
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
