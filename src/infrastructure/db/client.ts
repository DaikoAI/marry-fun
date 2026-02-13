import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

let cachedBinding: D1Database | null = null;

function isD1Database(value: unknown): value is D1Database {
  return typeof value === "object" && value !== null && "prepare" in value;
}

async function resolveD1Binding(): Promise<D1Database> {
  if (cachedBinding) {
    return cachedBinding;
  }

  const processBinding = process.env.DB as unknown;
  if (isD1Database(processBinding)) {
    cachedBinding = processBinding;
    return processBinding;
  }

  const { env } = await getCloudflareContext({ async: true });
  const binding = (env as { DB?: D1Database }).DB;

  if (isD1Database(binding)) {
    cachedBinding = binding;
    return binding;
  }

  throw new Error(
    "D1 binding `DB` is not available. Set wrangler d1_databases binding and run in OpenNext preview/worker.",
  );
}

export async function getDb() {
  const binding = await resolveD1Binding();
  return drizzle(binding, { schema });
}
