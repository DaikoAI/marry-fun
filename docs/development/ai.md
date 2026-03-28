# AI Development

marry.fun の AI チャット基盤は Vercel AI SDK と OpenAI API で構成する。

## Overview

- Runtime: Next.js on Cloudflare Workers
- Agent framework: Vercel AI SDK `ToolLoopAgent`
- Provider: `@ai-sdk/openai`
- Model: `gpt-4.1-mini` をコード定数で固定

## Prompt Source of Truth

- `prompts/SOUL.md`
- `prompts/NGWORD_AGENT.md`

これらの Markdown を `bun run sync:prompts` で `src/infrastructure/prompts/agent-prompts.generated.ts` に同期する。

generated file は直接編集しないこと。

## Environment Variables

必要なのは `OPENAI_API_KEY` のみ。

`.env.local` / `.env.production` は `dotenvx` 前提で暗号化管理する。

## Key Files

- `src/infrastructure/ai/model.ts`: hard-coded model 定義
- `src/infrastructure/ai/claw-agents.ts`: AI SDK agent 定義
- `src/infrastructure/adapter/ai-chat-vercel-agent.ts`: domain port 実装
- `src/infrastructure/container.ts`: DI 配線

## Common Commands

```bash
bun run sync:prompts
bun run dev
bun run test:run
bun run typecheck
```
