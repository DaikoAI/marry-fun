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

  it("build runs with NODE_ENV=production", () => {
    const scripts = readPackageScripts();
    const build = scripts.build;

    expect(build).toBeDefined();
    expect(build).toContain("NODE_ENV=production");
    expect(build).toContain("next build");
  });

  it("composite-only debug script exists", () => {
    const scripts = readPackageScripts();
    const composite = scripts["test:profile-composite"];

    expect(composite).toBeDefined();
    expect(composite).toContain("scripts/test-profile-image-composite.ts");
  });
});
