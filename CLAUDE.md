# CLAUDE.md

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
