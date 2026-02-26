import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

interface PackageJsonShape {
  scripts?: Partial<Record<string, string>>;
}

function readPackageScripts(): Record<string, string> {
  const raw = readFileSync("package.json", "utf8");
  const parsed = JSON.parse(raw) as PackageJsonShape;
  return parsed.scripts ?? {};
}

describe("package scripts", () => {
  it("dev is Wrangler-based local flow (not plain next dev)", () => {
    const scripts = readPackageScripts();
    const dev = scripts.dev;

    expect(dev).toBeDefined();
    expect(dev).toContain("build:cf:local");
    expect(dev).not.toContain("next dev");
  });

  it("preview uses .env.local for local Wrangler run", () => {
    const scripts = readPackageScripts();
    const preview = scripts.preview;

    expect(preview).toBeDefined();
    expect(preview).toContain(".env.local");
    expect(preview).toContain("opennextjs-cloudflare preview");
  });
});
