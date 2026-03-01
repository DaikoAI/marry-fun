import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

describe("Chat page prerender", () => {
  it("opts out from static prerendering to avoid build-time chat client execution", () => {
    const source = readFileSync(resolve(process.cwd(), "src/app/[locale]/chat/page.tsx"), "utf-8");
    expect(source).toMatch(/export const dynamic = "force-dynamic";/u);
  });
});
