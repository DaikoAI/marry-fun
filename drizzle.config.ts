import { existsSync, readdirSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig } from "drizzle-kit";

import { env } from "./src/env";

function getLocalDb(): string {
  const root = resolve(".wrangler");
  if (!existsSync(root)) {
    throw new Error(".wrangler directory not found");
  }

  const d1Path = resolve(root, "state/v3/d1/miniflare-D1DatabaseObject");
  if (existsSync(d1Path)) {
    const candidates = readdirSync(d1Path, { withFileTypes: true })
      .filter(entry => entry.isFile() && entry.name.endsWith(".sqlite"))
      .map(entry => resolve(d1Path, entry.name))
      .sort((a, b) => {
        const aMtime = statSync(a).mtimeMs;
        const bMtime = statSync(b).mtimeMs;
        return bMtime - aMtime;
      });

    if (candidates.length > 0) {
      return candidates[0];
    }
  }

  throw new Error("No D1 .sqlite found under .wrangler/state/v3/d1/miniflare-D1DatabaseObject");
}

const schemaPath = "./src/infrastructure/db/schema/index.ts";
const outPath = "./migrations";

const config =
  process.env.NODE_ENV === "production" ?
    (() => {
      if (!env.CLOUDFLARE_ACCOUNT_ID || !env.CLOUDFLARE_DATABASE_ID || !env.CLOUDFLARE_D1_TOKEN) {
        throw new Error("Missing CLOUDFLARE_ACCOUNT_ID / CLOUDFLARE_DATABASE_ID / CLOUDFLARE_D1_TOKEN for remote D1.");
      }

      return defineConfig({
        schema: schemaPath,
        out: outPath,
        dialect: "sqlite",
        driver: "d1-http",
        dbCredentials: {
          accountId: env.CLOUDFLARE_ACCOUNT_ID,
          databaseId: env.CLOUDFLARE_DATABASE_ID,
          token: env.CLOUDFLARE_D1_TOKEN,
        },
        strict: true,
        verbose: true,
      });
    })()
  : defineConfig({
      schema: schemaPath,
      dialect: "sqlite",
      out: outPath,
      dbCredentials: { url: getLocalDb() },
      strict: true,
      verbose: true,
    });

export default config;
