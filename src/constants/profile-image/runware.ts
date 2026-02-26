export const RUNWARE_PROFILE_MODEL_DEFAULT = "runware:400@1";

export const RUNWARE_PROFILE_IMAGE_SIZE = {
  // Keep output dimensions aligned with FLUX-friendly multiples.
  width: 768,
  height: 960,
} as const;

export const RUNWARE_PROFILE_NUM_RESULTS = 1;
export const RUNWARE_PROFILE_OUTPUT_FORMAT = "PNG";
export const RUNWARE_PROFILE_STEPS = 28;
export const RUNWARE_PROFILE_CFG = 6.5;
export const RUNWARE_PROFILE_PROMPT_MAX_LENGTH = 300;

export const RUNWARE_PROFILE_NEGATIVE_PROMPT = [
  "low quality",
  "blurry",
  "deformed face",
  "extra faces",
  "bad anatomy",
  "distorted body",
  "watermark",
  "text artifacts",
  "logo",
].join(", ");

export const RUNWARE_PROFILE_PROMPT_BASE = `Anime-style profile avatar, vertical composition (4:5 aspect ratio), optimized for smartphone display.

A man wearing a tailored matte black business suit, crisp white dress shirt, slim black tie, taking a smartphone selfie. Framing: upper torso to head, centered composition, camera slightly above eye level, confident relaxed expression. Suit details, pose, framing, and camera angle must remain identical across generations.

Background: modern luxury high-rise apartment interior at night, large floor-to-ceiling window with soft city lights bokeh, warm ambient lighting, minimalistic premium interior, shallow depth of field, sophisticated and attractive atmosphere.

Lighting: soft cinematic lighting, warm highlights, natural skin shadows, subtle rim light from window.

Use the uploaded image strictly and directly as the face. Do NOT redraw or stylize the face. Preserve exact facial structure, proportions, skin tone, lighting, hairstyle, and expression. Do not apply color correction to the face.

Seamlessly merge the original face onto the illustrated body. Only the face should vary. Body, suit, background, and framing must remain consistent.

If face detection fails or is incomplete, reconstruct minimally while preserving maximum resemblance and original color tone.`;

// Keep prompt compact to avoid provider-side validation errors.
// Keep core constraints compact while preserving composition/identity requirements.
export const RUNWARE_PROFILE_PROMPT_CORE =
  "rwre, anime-style selfie portrait, black suit, white shirt, black tie, smartphone selfie, upper torso centered, slight high-angle camera, confident relaxed expression, luxury high-rise apartment night bokeh, warm cinematic lighting, preserve exact reference face identity";

/** Background-only prompt: warm brick/wall texture, no person. Used behind the Tinder-style card. */
export const RUNWARE_PROFILE_BACKGROUND_PROMPT =
  "warm brown orange brick wall texture, old rustic wall, rough irregular surface, natural lighting, shallow depth of field, no people, no characters, no text, seamless background, vertical composition 4:5";

const X_PROFILE_SIZE_NAMES = new Set(["mini", "normal", "bigger", "small", "thumb"]);

export function normalizeRunwareReferenceImageUrl(imageUrl: string): string {
  let parsed: URL;
  try {
    parsed = new URL(imageUrl);
  } catch {
    return imageUrl;
  }

  if (parsed.hostname !== "pbs.twimg.com" || !parsed.pathname.includes("/profile_images/")) {
    return imageUrl;
  }

  const segments = parsed.pathname.split("/");
  const fileName = segments.at(-1);
  if (fileName) {
    const replaced = fileName.replace(/_(normal|bigger|mini|small|thumb)(\.[a-zA-Z0-9]+)$/u, "_400x400$2");
    if (replaced !== fileName) {
      segments[segments.length - 1] = replaced;
      parsed.pathname = segments.join("/");
    }
  }

  const nameParam = parsed.searchParams.get("name");
  if (nameParam && X_PROFILE_SIZE_NAMES.has(nameParam)) {
    parsed.searchParams.set("name", "400x400");
  }

  return parsed.toString();
}

export function buildRunwareProfilePrompt(input: {
  locale: "ja" | "en";
  displayName: string;
  xUsername: string | null;
}): string {
  const safeDisplayName = input.displayName.trim().slice(0, 24) || "guest";
  const safeUsername = (input.xUsername ?? "unknown").trim().replace(/^@+/, "").slice(0, 16) || "unknown";
  const localeHint = input.locale === "ja" ? "jp" : "en";

  const prompt = `${RUNWARE_PROFILE_PROMPT_CORE}, id:${safeDisplayName}, x:@${safeUsername}, locale:${localeHint}`;
  return prompt.slice(0, RUNWARE_PROFILE_PROMPT_MAX_LENGTH);
}
