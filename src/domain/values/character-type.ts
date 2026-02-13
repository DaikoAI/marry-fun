export const CHARACTER_TYPES = ["tsundere", "tennen", "cool", "amaenbou", "genki"] as const;

export type CharacterType = (typeof CHARACTER_TYPES)[number];

export function randomCharacterType(): CharacterType {
  return CHARACTER_TYPES[Math.floor(Math.random() * CHARACTER_TYPES.length)];
}
