import { describe, expect, it } from "vitest";
import { CHARACTER_TYPES, randomCharacterType } from "@/domain/values/character-type";

describe("CharacterType", () => {
  it("CHARACTER_TYPESは5種のキャラタイプを持つ", () => {
    expect(CHARACTER_TYPES).toEqual(["tsundere", "tennen", "cool", "amaenbou", "genki"]);
  });

  it("randomCharacterTypeは5種のいずれかを返す", () => {
    for (let i = 0; i < 50; i++) {
      const result = randomCharacterType();
      expect(CHARACTER_TYPES).toContain(result);
    }
  });
});
