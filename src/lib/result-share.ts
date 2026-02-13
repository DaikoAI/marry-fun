export interface ShareStats {
  chats: number;
  points: number;
}

const MIN_VALUE = 0;
const MAX_CHATS = 999;
const MAX_POINTS = 9_999_999;

function toBoundedInteger(value: unknown, max: number): number {
  const parsed =
    typeof value === "number" ? value
    : typeof value === "string" ? Number(value)
    : Number.NaN;

  if (!Number.isFinite(parsed)) return MIN_VALUE;

  const floored = Math.floor(parsed);
  return Math.max(MIN_VALUE, Math.min(max, floored));
}

export function normalizeShareStats(input: { chats: unknown; points: unknown }): ShareStats {
  return {
    chats: toBoundedInteger(input.chats, MAX_CHATS),
    points: toBoundedInteger(input.points, MAX_POINTS),
  };
}

export function encodeShareRecord(input: { chats: unknown; points: unknown }): string {
  const stats = normalizeShareStats(input);
  return `${String(stats.chats)}-${String(stats.points)}`;
}

export function decodeShareRecord(record: string | null | undefined): ShareStats {
  if (!record) return { chats: 0, points: 0 };

  const [chats, points, ...rest] = record.split("-");
  if (!chats || !points || rest.length > 0) {
    return { chats: 0, points: 0 };
  }

  return normalizeShareStats({ chats, points });
}

export function countUserChats(messages: ReadonlyArray<{ role: string }>): number {
  return messages.reduce((count, message) => count + (message.role === "user" ? 1 : 0), 0);
}

export function buildResultSharePath(locale: string, input: { chats: unknown; points: unknown }): string {
  const record = encodeShareRecord(input);
  return `/${locale}/result/${record}`;
}

export function buildXIntentUrl(text: string, url: string): string {
  const params = new URLSearchParams({ text, url });
  return `https://twitter.com/intent/tweet?${params.toString()}`;
}
