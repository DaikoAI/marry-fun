import { describe, expect, it } from "vitest";

import {
  buildResultSharePath,
  buildXIntentUrl,
  countUserChats,
  decodeShareRecord,
  encodeShareRecord,
  normalizeShareStats,
} from "@/lib/result-share";

describe("normalizeShareStats", () => {
  it("normalizes invalid values to zero", () => {
    expect(normalizeShareStats({ chats: "abc", points: null })).toEqual({ chats: 0, points: 0 });
  });

  it("clamps chats and points into allowed ranges", () => {
    expect(normalizeShareStats({ chats: -2, points: 99_999_999 })).toEqual({ chats: 0, points: 9_999_999 });
  });

  it("floors decimal values", () => {
    expect(normalizeShareStats({ chats: 12.8, points: 450.9 })).toEqual({ chats: 12, points: 450 });
  });
});

describe("share record codec", () => {
  it("encodes normalized stats as record string", () => {
    expect(encodeShareRecord({ chats: 7, points: 450 })).toBe("7-450");
  });

  it("decodes valid record", () => {
    expect(decodeShareRecord("20-9999")).toEqual({ chats: 20, points: 9999 });
  });

  it("returns zeros for invalid record format", () => {
    expect(decodeShareRecord("broken")).toEqual({ chats: 0, points: 0 });
  });

  it("round-trips stats", () => {
    const encoded = encodeShareRecord({ chats: 15, points: 3210 });
    expect(decodeShareRecord(encoded)).toEqual({ chats: 15, points: 3210 });
  });
});

describe("share helpers", () => {
  it("counts only user messages", () => {
    expect(countUserChats([{ role: "girl" }, { role: "user" }, { role: "girl" }, { role: "user" }])).toBe(2);
  });

  it("builds result page path with encoded record", () => {
    expect(buildResultSharePath("ja", { chats: 3, points: 1200 })).toBe("/ja/result/3-1200");
  });

  it("builds x intent url with text and target url", () => {
    const intent = buildXIntentUrl("hello world", "https://example.com/ja/result/1-100");
    const parsed = new URL(intent);

    expect(parsed.origin + parsed.pathname).toBe("https://twitter.com/intent/tweet");
    expect(parsed.searchParams.get("text")).toBe("hello world");
    expect(parsed.searchParams.get("url")).toBe("https://example.com/ja/result/1-100");
  });
});
