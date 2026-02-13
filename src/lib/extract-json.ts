/**
 * Strip markdown code blocks if present.
 * LLMs sometimes wrap JSON in ```json ... ``` or ``` ... ```.
 */
export function extractJson(content: string): string {
  const trimmed = content.trim();
  const blockMatch = trimmed.match(/^```(?:json)?\s*\n([\s\S]*?)```\s*$/);
  if (blockMatch) return blockMatch[1].trim();
  const openMatch = trimmed.match(/^```(?:json)?\s*\n([\s\S]*)$/);
  if (openMatch) return openMatch[1].trim();
  return trimmed;
}
