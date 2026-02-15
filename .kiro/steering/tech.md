# Technology Stack

## Architecture

Next.js App Router をベースとした SPA/SSR ハイブリッド。Cloudflare Workers へ OpenNext でデプロイし、`[locale]` 動的セグメントによる i18n ルーティングを採用。

## Core Technologies

- **Language**: TypeScript
- **Framework**: Next.js 16, React 19
- **Runtime**: Node.js (開発) / Cloudflare Workers (本番)
- **Package Manager**: Bun

## Key Libraries

- **next-intl**: i18n（ルーティング、翻訳、ナビゲーション）
- **@react-three/fiber / drei**: 3D シーン描画
- **zustand**: クライアント状態管理
- **use-sound**: オーディオ再生（BGM ループ）
- **Tailwind CSS 4**: スタイリング
- **better-auth + Solana Web3**: ウォレット認証（Web3 サインアップ）
- **Drizzle + Cloudflare D1**: ORM と SQLite 互換 DB
- **Moltworker + OpenClaw**: AI チャット（Anthropic API 経由）

## Development Standards

### Type Safety

- TypeScript strict mode
- `@t3-oss/env-nextjs` + Zod による環境変数スキーマ検証

### Code Quality

- ESLint: `@posaune0423/eslint-config` + Next.js plugin
- Prettier: organize-imports, OXC, Tailwind プラグイン
- React Compiler: `babel-plugin-react-compiler` による自動最適化

### Environment Variables

- **dotenvx**: `.env` を暗号化し Git 管理、`.env.keys` は secrets 管理
- 起動時に `src/env.ts` のスキーマで検証

## Development Environment

### Required Tools

- Bun 1.3+
- dotenvx（暗号化・復号）

### Common Commands

```bash
# Dev: bun run dev (build:cf → preview)
# Build: bun run build または bun run build:cf
# Deploy: bun run deploy
# Lint: bun run lint / bun run format
# TypeCheck: bun run typecheck
```

## Key Technical Decisions

- **OpenNext + Cloudflare**: Next.js を Workers 上で動かすため OpenNext を使用
- **localePrefix: "always"**: URL に常にロケールを含める方針
- **Zustand**: チャット・ゲーム状態をシンプルに管理
- **Clean Architecture**: domain → usecase → interfaces/infrastructure の依存方向（`docs/development/server.md` 準拠）

---

_Document standards and patterns, not every dependency_

<!-- updated_at: 2025-02-14 | Sync: Drizzle/D1, better-auth/Solana, Moltworker, React Compiler, Clean Architecture -->
