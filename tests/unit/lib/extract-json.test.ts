import { describe, expect, it } from "vitest";
import { extractJson } from "@/lib/extract-json";

describe("extractJson", () => {
  it("returns content as-is when no code block", () => {
    const json = '{"message":"hi","score":5,"emotion":"joy"}';
    expect(extractJson(json)).toBe(json);
  });

  it("strips ```json ... ``` block", () => {
    const wrapped = '```json\n{ "message": "Hello!", "score": 5, "emotion": "joy" }\n```';
    expect(extractJson(wrapped)).toBe('{ "message": "Hello!", "score": 5, "emotion": "joy" }');
  });

  it("strips ``` ... ``` block (no lang)", () => {
    const wrapped = '```\n{"a":1}\n```';
    expect(extractJson(wrapped)).toBe('{"a":1}');
  });

  it("handles unclosed block (extracts from opening)", () => {
    const wrapped = '```json\n{"message":"ok","score":5,"emotion":"default"}';
    expect(extractJson(wrapped)).toBe('{"message":"ok","score":5,"emotion":"default"}');
  });

  it("trims outer whitespace", () => {
    const wrapped = '  \n```json\n{"x":1}\n```  ';
    expect(extractJson(wrapped)).toBe('{"x":1}');
  });
});
