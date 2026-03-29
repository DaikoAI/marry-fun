import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

interface PackageJsonShape {
  scripts?: Record<string, unknown>;
}

function readPackageScripts(): Record<string, string> {
  const raw = readFileSync("package.json", "utf8");
  const parsed = JSON.parse(raw) as PackageJsonShape;
  const scripts = parsed.scripts ?? {};

  return Object.fromEntries(
    Object.entries(scripts).filter((entry): entry is [string, string] => typeof entry[1] === "string"),
  );
}

describe("package scripts", () => {
  it("dev syncs prompts and starts next dev on port 8787", () => {
    const scripts = readPackageScripts();
    const dev = scripts.dev;

    expect(dev).toBeDefined();
    expect(dev).toContain("sync:prompts");
    expect(dev).toContain("next dev");
    expect(dev).toContain("--port 8787");
  });

  it("preview uses opennextjs-cloudflare preview", () => {
    const scripts = readPackageScripts();
    const preview = scripts.preview;

    expect(preview).toBeDefined();
    expect(preview).toContain("opennextjs-cloudflare preview");
  });

  it("build syncs prompts before next build", () => {
    const scripts = readPackageScripts();
    const build = scripts.build;

    expect(build).toBeDefined();
    expect(build).toContain("sync:prompts");
    expect(build).toContain("next build");
  });

  it("sync:prompts script exists", () => {
    const scripts = readPackageScripts();
    const syncPrompts = scripts["sync:prompts"];

    expect(syncPrompts).toBeDefined();
    expect(syncPrompts).toContain("scripts/sync-prompts.ts");
  });
});
