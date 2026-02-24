# AGENTS.md / CLAUDE.md

## Game Overview

marry.fun is an AI-powered dating simulation game built for the OpenClaw Hackathon.
Players chat with "Claw-chan," an AI heroine powered by OpenClaw (Moltworker on Cloudflare Workers),
and compete for the highest score to win her heart — and real prizes.

### How It Works

1. **Enter your username** and start a chat session with Claw-chan
2. **Each session, Claw-chan is randomly assigned one of 5 personality types**
   (tsundere, airhead, cool, clingy, energetic) — the player doesn't know which one
3. **Send messages to Claw-chan** and earn points (score 1–10) based on how well
   your words match her hidden personality type
4. **$MARRY token holders get a score bonus** — holding more tokens = higher multiplier
5. **Beware of NG words** — Claw-chan secretly generates 20 forbidden words at the start
   of each session. Say one, and she gets angry → instant Game Over

### Winning Conditions

- **Daily Top Player** becomes Claw-chan's "boyfriend" and earns 70% of that day's
  $MARRY creator fees for the following day
- **Marriage Partner** is chosen from past boyfriends on the final day.
  The chosen player wins 10% of all-time $MARRY creator fees as a jackpot prize

### Session Mechanics

- Each session has 20 chat turns (remainingChats)
- Points are calculated as: `score × tokenBonus` (default bonus: 1.5x)
- 10% of earned points are added to the jackpot pool
- Claw-chan expresses emotions (joy, embarrassed, angry, sad, default)
  that change her visual expression in real-time

## Project Context

- **Hackathon**: OpenClaw Hackathon
- **Required Infra**: Cloudflare Workers Paid + Moltworker + OpenClaw agent
- **Architecture**: Next.js (Cloudflare) → OpenAI SDK → Moltworker (CF Workers) → Anthropic API
- **Core Features**: 5 character types, NG word game over, scoring system

## Post-Implementation Review

After completing an implementation, always run the following 3 skills for review:

1. **UI UX Pro Max** (`ui-ux-pro-max`) — UI/UX design quality review
2. **Vercel React Best Practices** (`vercel-react-best-practices`) — React/Next.js performance optimization review
3. **Web Design Guidelines** (`web-design-guidelines`) — Web interface guidelines compliance check

## Documentation-First Rules

For infra setup and OpenClaw-related work, always refer to existing docs before making changes.

- Infra setup: treat `openclaw/README.md` as the primary reference
- Moltworker / container: refer to `.moltworker/README.md` and `.moltworker/AGENTS.md`
- **Server development**: follow `docs/development/server.md` for architecture, layer rules, and conventions

---

# Agent Guidelines

- Always prefer simplicity over pathological correctness. YAGNI, KISS, DRY. No backward-compat shims or fallback paths unless they come free without adding cyclomatic complexity.

## Steering (Project Context)

Load `.kiro/steering/` as project memory at session start or when context is needed.

- **Path**: `.kiro/steering/`
- **Default files**: `product.md`, `tech.md`, `structure.md`
- **Custom files**: Supported; add or manage as needed for the project

Use steering to align decisions with product goals, tech stack, and structure.

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

- After ANY correction from the user: update `docs/tasks/lessons.md` with the pattern
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

1. **Plan First**: Write plan to `docs/tasks/todo.md` with checkable items
2. **Verify Plan**: Check in before starting implementation
3. **Track Progress**: Mark items complete as you go
4. **Explain Changes**: High-level summary at each step
5. **Document Results**: Add review section to `docs/tasks/todo.md`
6. **Capture Lessons**: Update `docs/tasks/lessons.md` after corrections

## Core Principles

- **Simplicity First**: Make every change as simple as possible. Impact minimal code.
- **No Laziness**: Find root causes. No temporary fixes. Senior developer standards.
- **Minimal Impact**: Changes should only touch what's necessary. Avoid introducing bugs.
