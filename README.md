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

`marry.fun` は、**pump.fun の fee sharing 機能を実装した**オンチェーン恋愛ゲームです。  
AI動画時代の新しい物語IPとトークン流動性を接続し、「語れるミーム」を「取引できる資産」に変換します。

コア体験は以下です。

- `$MARRY` を発行し、初日から Solana 上で売買可能
- AI girl と会話して親密度（intimacy）を獲得
- その日の Boyfriend がクリエイター手数料の 60% を受け取る
- 最終的に Husband が選出され、Jackpot（蓄積プール 10%）を獲得

## Problem Statement

ミームコインはストーリーテリングですが、AIによる AAA コンテンツ制作コストの大幅低下で高品質クリエイターが急増する一方、資本形成と注目維持の仕組みは不足しています。  
degen トレーダーは次のナラティブを探し続けていますが、高密度な物語とトークン流動性の間に大きな断絶があります。  
`marry.fun` はこの断絶を埋め、バイラルな AI ナラティブを流動性のあるトレード可能資産に変えます。

## How It Works

- **$MARRY token**: チャット参加に必要。1人の AI girl と会話し、親密度ポイントを獲得。
- **Boyfriend**: 日次で親密度トップのユーザーが選出され、creator fee の 60% を受領。
- **Marriage**: 元 Boyfriend 群からポイント + RNG で Husband を選出し、Jackpot を付与。
- **Points**: チャット、トークン保有、SNS（X follow / RT）、buy & hold で加点。

## Technical Approach

- **Token Launch**: `$MARRY` を Solana 上でローンチし、初日から自由に取引可能。
- **Creator Fee Sharing**: `pump.fun` モデルをベースにした fee-sharing スマートコントラクトで取引手数料を蓄積・分配。
- **Narrative-Linked Claims**: 物語上の勝者（Husband）が、蓄積された creator fee を直接 claim 可能。
- **AI x Onchain Infra**: AI agent のプロンプト設計とオンチェーン実装を接続し、ストーリー進行に金融インセンティブを同期。

## Target Audience

- **GenAI ネイティブ動画クリエイター（X）**: バイラルな AAA 風トレーラーを作れるが、従来のマネタイズ導線を持たない層。
- **Solana degen トレーダー**: 高ロア（high-lore）トークンに早期参加し、注目経済の勝者にベットしたい層。

## Business Model

- **Transaction Fees**: プラットフォーム上の取引ごとに 0.5% を徴収（pump.fun の成功モデルを踏襲）。
- **AI Tool Revenue**: クリエイター向け自動 AI 動画生成・エージェントツールを従量課金で提供。
- **Creator Fee Pool Share**: creator fee プールの一部を運営収益化し、次世代 AI ストーリー制作へ再投資。

## Competitive Landscape

- **vs. Zora / 10k**: 新しいソーシャル島を作るのではなく、`X-native` に徹して既存アテンション上で拡散。
- **vs. Story Protocol**: 法務・L1 レイヤー中心ではなく、Solana の DeFi 合成可能性を使って即時流動性と娯楽性を提供。

IP を登録するだけではなく、IP を「取引できて楽しい」状態にすることを重視します。

## Future Vision

`$MARRY` の成功後は、`AI Superpower` スタジオツールを一般クリエイターに開放し、任意のナラティブを permissionless に即時トークン化できる基盤を目指します。  
長期的には、コミュニティ主導のトークン管理型 IP ライセンシングへ拡張し、ゲーム・マーチャンダイズ・メディア展開の価値分配をクリエイターとコミュニティの双方で担える世界を作ります。

## Tech

<p align="center">
  <img src="https://img.shields.io/badge/pump.fun-Fee_Sharing-00D4AA?style=flat-square" alt="pump.fun Fee Sharing" />
  <img src="https://img.shields.io/badge/Next.js-16-black?logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Three.js-R3F-000000?logo=threedotjs" alt="Three.js" />
  <img src="https://img.shields.io/badge/Zustand-5-764ABC" alt="Zustand" />
</p>

- **Core**: `pump.fun` fee sharing 機能を活用した creator fee 分配設計（Boyfriend/Husband claim）
- Next.js 16 / React 19 / TypeScript
- Bun, OpenNext (`@opennextjs/cloudflare`) + Cloudflare Workers
- Solana smart contract + fee-sharing distribution
- Moltworker, OpenClaw（AI chat）
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
