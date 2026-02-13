#!/usr/bin/env bun
/**
 * Syncs openclaw/SOUL.md into src/lib/soul-prompt.generated.ts.
 * Run before build. SOUL.md is the single source of truth.
 * Only writes when content differs to avoid triggering watcher restarts.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { logger } from "../src/utils/logger";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const SOUL_PATH = resolve(ROOT, "openclaw/SOUL.md");
const OUT_PATH = resolve(ROOT, "src/lib/soul-prompt.generated.ts");

const content = readFileSync(SOUL_PATH, "utf-8");
const escaped = content.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$\{/g, "\\${");

const output = `// Auto-generated from openclaw/SOUL.md — do not edit directly.
// Run \`bun run sync:soul\` to regenerate.

export const CHAT_SYSTEM_PROMPT = \`${escaped}\`;
`;

const existing = existsSync(OUT_PATH) ? readFileSync(OUT_PATH, "utf-8") : null;
if (existing !== output) {
  writeFileSync(OUT_PATH, output, "utf-8");
  logger.log("synced openclaw/SOUL.md → src/lib/soul-prompt.generated.ts");
}
