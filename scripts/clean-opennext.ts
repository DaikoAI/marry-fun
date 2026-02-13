#!/usr/bin/env bun
/**
 * Removes .open-next to avoid ENOTEMPTY when OpenNext starts a fresh build.
 * Run before build:cf when dev restarts cause overlapping builds.
 */
import { rmSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const OPEN_NEXT_DIR = resolve(ROOT, ".open-next");

if (existsSync(OPEN_NEXT_DIR)) {
  try {
    rmSync(OPEN_NEXT_DIR, { recursive: true, force: true });
  } catch (err) {
    console.warn(`Non-fatal: could not fully remove ${OPEN_NEXT_DIR}:`, err);
  }
}
