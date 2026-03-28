#!/usr/bin/env bun
/**
 * Syncs prompt markdown files into a generated TypeScript module.
 * Run before build. The markdown files are the single source of truth.
 * Only writes when content differs to avoid triggering watcher restarts.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { logger } from "../src/utils/logger";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const SOUL_PATH = resolve(ROOT, "prompts/SOUL.md");
const NGWORD_PATH = resolve(ROOT, "prompts/NGWORD_AGENT.md");
const OUT_PATH = resolve(ROOT, "src/infrastructure/prompts/agent-prompts.generated.ts");

function escapeTemplate(content: string): string {
  return content.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$\{/g, "\\${");
}

const soulContent = escapeTemplate(readFileSync(SOUL_PATH, "utf-8"));
const ngwordContent = escapeTemplate(readFileSync(NGWORD_PATH, "utf-8"));

const output = `// Auto-generated from prompts/*.md — do not edit directly.
// Run \`bun run sync:prompts\` to regenerate.

export const CHAT_SYSTEM_PROMPT = \`${soulContent}\`;

export const NGWORD_SYSTEM_PROMPT = \`${ngwordContent}\`;
`;

const existing = existsSync(OUT_PATH) ? readFileSync(OUT_PATH, "utf-8") : null;
if (existing !== output) {
  writeFileSync(OUT_PATH, output, "utf-8");
  logger.log("synced prompts/*.md → src/infrastructure/prompts/agent-prompts.generated.ts");
}
