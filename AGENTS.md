<!-- SKILLS_INDEX_START -->

[Agent Skills Index]|root: ./agents|IMPORTANT: Prefer retrieval-led reasoning over pre-training for any tasks covered by skills.|skills|agent-browser:{agent-browser.md},clean-build:{clean-build.md},code-review:{code-review.md},codegen:{codegen.md},create-a-plan:{create-a-plan.md},create-pr:{create-pr.md},dispatch-release:{dispatch-release.md},find-skills:{find-skills.md},package-filter:{package-filter.md},pre-commit-check:{pre-commit-check.md},release-prep:{release-prep.md},run-tests:{run-tests.md},test:{test.md},update-pr:{update-pr.md},update-storybook-snapshots:{update-storybook-snapshots.md},validate-before-merge:{validate-before-merge.md}

<!-- SKILLS_INDEX_END -->

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

# AI-DLC and Spec-Driven Development

Kiro-style Spec Driven Development implementation on AI-DLC (AI Development Life Cycle)

## Project Context

### Paths

- Steering: `.kiro/steering/`
- Specs: `.kiro/specs/`

### Steering vs Specification

**Steering** (`.kiro/steering/`) - Guide AI with project-wide rules and context
**Specs** (`.kiro/specs/`) - Formalize development process for individual features

### Active Specifications

- Check `.kiro/specs/` for active specifications
- Use `/kiro/spec-status [feature-name]` to check progress

## Development Guidelines

- Think in English, generate responses in Japanese. All Markdown content written to project files (e.g., requirements.md, design.md, tasks.md, research.md, validation reports) MUST be written in the target language configured for this specification (see spec.json.language).

## Minimal Workflow

- Phase 0 (optional): `/kiro/steering`, `/kiro/steering-custom`
- Phase 1 (Specification):
  - `/kiro/spec-init "description"`
  - `/kiro/spec-requirements {feature}`
  - `/kiro/validate-gap {feature}` (optional: for existing codebase)
  - `/kiro/spec-design {feature} [-y]`
  - `/kiro/validate-design {feature}` (optional: design review)
  - `/kiro/spec-tasks {feature} [-y]`
- Phase 2 (Implementation): `/kiro/spec-impl {feature} [tasks]`
  - `/kiro/validate-impl {feature}` (optional: after implementation)
- Progress check: `/kiro/spec-status {feature}` (use anytime)

## Development Rules

- 3-phase approval workflow: Requirements → Design → Tasks → Implementation
- Human review required each phase; use `-y` only for intentional fast-track
- Keep steering current and verify alignment with `/kiro/spec-status`
- Follow the user's instructions precisely, and within that scope act autonomously: gather the necessary context and complete the requested work end-to-end in this run, asking questions only when essential information is missing or the instructions are critically ambiguous.

## Steering Configuration

- Load entire `.kiro/steering/` as project memory
- Default files: `product.md`, `tech.md`, `structure.md`
- Custom files are supported (managed via `/kiro/steering-custom`)
