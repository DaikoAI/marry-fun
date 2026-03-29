# Agent Guidelines

## Steering (Project Context)

Load `docs/` as project memory at session start or when context is needed.

- **Path**: `docs/`
- **Default files**: `PRODUCT.md`, `TECH.md`, `STRUCTURE.md`
- **Other docs**: Add or manage as needed (e.g. `.agents/memory/`, domain-specific .md)

Use steering to align decisions with product goals, tech stack, and structure.

---

## Agent Catalog

### Planner

- **Purpose**: 非自明タスクを分解し、実行計画と検証観点を整理する
- **Inputs**: ユーザー要求、`docs/`、現在の差分と PR 状態
- **Outputs**: `.agents/memory/todo.md` のチェックリストと review メモ
- **Usage**: 3 ステップ以上の作業、設計判断、PR 対応で最初に起動する
- **Memory**: `.agents/memory/todo.md`, `.agents/memory/lessons.md`

### Executor

- **Purpose**: 計画に沿ってコード・設定・テストを更新する
- **Inputs**: Planner が確定した作業項目、対象ファイル、既存テスト
- **Outputs**: 最小差分の実装、必要な追従テスト、commit-ready な変更
- **Usage**: `src/`, `tests/`, 設定ファイルの修正全般
- **Code Surface**: `src/`, `tests/`, `.github/`, `scripts/`

### Verifier

- **Purpose**: 変更が壊していないことをローカル検証と PR 状態で証明する
- **Inputs**: 変更差分、CI 結果、レビュー指摘、各種 quality gate
- **Outputs**: 実行済みコマンド、残リスク、必要なら追加修正
- **Usage**: `format` / `lint` / `typecheck` / `test:run` と PR の再監視
- **Memory**: `.agents/memory/todo.md`

### AiChatVercelAgent

- **Purpose**: ドメインの `AiChatAdapter` 実装として OpenAI へのチャット入出力を提供する
- **Inputs**: `sessionId`, `characterType`, `username`, `message`, `locale`
- **Outputs**: `message`, `score`, `emotion` と NG-word 用の補助結果
- **Usage**: `src/infrastructure/adapter/ai-chat-vercel-agent.ts`
- **Dependencies**: `clawChatAgent`, `clawNgWordAgent`, `clawShockAgent`, `src/constants/prompts/agent-prompts.generated.ts`

### clawChatAgent

- **Purpose**: 通常会話の structured output を 1 step で生成する
- **Inputs**: chat prompt
- **Outputs**: `marry_fun_chat_response`
- **Usage**: `src/infrastructure/ai/claw-agents.ts`

### clawNgWordAgent

- **Purpose**: NG word 候補 30 件を structured output で返す
- **Inputs**: NG-word prompt
- **Outputs**: `marry_fun_ngwords_response`
- **Usage**: `src/infrastructure/ai/claw-agents.ts`

### clawShockAgent

- **Purpose**: NG word 命中時のショック返答を生成する
- **Inputs**: shock prompt
- **Outputs**: plain text response
- **Usage**: `src/infrastructure/ai/claw-agents.ts`

## Workflow Orchestration

### 1. Plan Node Default

- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)
- If something goes sideways, STOP and re-plan immediately - don't keep pushing
- Use plan mode for verification steps, not just building
- Write detailed specs upfront to reduce ambiguity

### 2. Subagent Strategy

- Use subagents liberally to keep main context window clean
- Offload research, exploration, and parallel analysis to subagents
- For complex problems, throw more compute at it via subagents
- One tack per subagent for focused execution

### 3. Self-Improvement Loop

- After ANY correction from the user: update `.agents/memory/lessons.md` with the pattern
- Write rules for yourself that prevent the same mistake
- Ruthlessly iterate on these lessons until mistake rate drops
- Review lessons at session start for relevant project

### 4. Verification Before Done

- Never mark a task complete without proving it works
- Diff behavior between main and your changes when relevant
- Ask yourself: "Would a staff engineer approve this?"
- Run tests, check logs, demonstrate correctness

### 5. Demand Elegance (Balanced)

- For non-trivial changes: pause and ask "is there a more elegant way?"
- If a fix feels hacky: "Knowing everything I know now, implement the elegant solution"
- Skip this for simple, obvious fixes - don't over-engineer
- Challenge your own work before presenting it

### 6. Autonomous Bug Fixing

- When given a bug report: just fix it. Don't ask for hand-holding
- Point at logs, errors, failing tests - then resolve them
- Zero context switching required from the user
- Go fix failing CI tests without being told how

## Task Management

1. **Plan First**: Write plan to `.agents/memory/todo.md` with checkable items
2. **Verify Plan**: Check in before starting implementation
3. **Track Progress**: Mark items complete as you go
4. **Explain Changes**: High-level summary at each step
5. **Document Results**: Add review section to `.agents/memory/todo.md`
6. **Capture Lessons**: Update `.agents/memory/lessons.md` after corrections

## Core Principles

- Always prefer simplicity over pathological correctness. YAGNI, KISS, DRY. No backward-compat shims or fallback paths unless they come free without adding cyclomatic complexity.
- **Simplicity First**: Make every change as simple as possible. Impact minimal code.
- **No Laziness**: Find root causes. No temporary fixes. Senior developer standards.
- **Minimal Impact**: Changes should only touch what's necessary. Avoid introducing bugs.
