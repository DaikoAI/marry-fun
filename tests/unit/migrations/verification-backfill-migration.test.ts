import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

describe("verification backfill migration", () => {
  it("includes an idempotent migration that creates verification table for old local DBs", () => {
    const migrationsDir = "migrations";
    const migrationFiles = readdirSync(migrationsDir)
      .filter(name => name.endsWith(".sql"))
      .sort();

    const backfillFile = migrationFiles.find(name => {
      const sql = readFileSync(join(migrationsDir, name), "utf8");
      return sql.includes("CREATE TABLE IF NOT EXISTS `verification`");
    });
    expect(backfillFile).toBeDefined();

    const sql = readFileSync(join(migrationsDir, backfillFile ?? ""), "utf8");
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS `verification`");
    expect(sql).toContain("CREATE INDEX IF NOT EXISTS `verification_identifier_idx`");
  });
});
