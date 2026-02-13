export const EMOTIONS = ["default", "joy", "embarrassed", "angry", "sad"] as const;

export type Emotion = (typeof EMOTIONS)[number];

export function isEmotion(value: string): value is Emotion {
  return (EMOTIONS as readonly string[]).includes(value);
}
