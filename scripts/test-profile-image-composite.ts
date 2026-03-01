#!/usr/bin/env bun

import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  buildRunwareProfilePrompt,
  normalizeRunwareReferenceImageUrl,
  RUNWARE_PROFILE_BACKGROUND_PROMPT,
  RUNWARE_PROFILE_CFG,
  RUNWARE_PROFILE_IMAGE_SIZE,
  RUNWARE_PROFILE_NEGATIVE_PROMPT,
  RUNWARE_PROFILE_NUM_RESULTS,
  RUNWARE_PROFILE_OUTPUT_FORMAT,
  RUNWARE_PROFILE_STEPS,
} from "../src/constants/profile-image/runware";
import { createTinderProfileCompositeImage } from "../src/lib/profile-image/tinder-composite";

const DEFAULT_REFERENCE_IMAGE_URL = "https://pbs.twimg.com/profile_images/1926095842227666944/vMqdpOz__normal.jpg";
const DEFAULT_RUNWARE_MODEL = "runware:400@1";

interface CliOptions {
  reference: string;
  useRunware: boolean;
  locale: "ja" | "en";
  seed?: number;
  character?: string;
  background?: string;
  out: string;
  name: string;
  location: string;
  tags: string[];
  badge: string;
  age: number;
  university: string;
  distanceKm: number;
  frameColor?: string;
  frameWidth?: number;
  frameRadius?: number;
}

const DEFAULTS = {
  reference: DEFAULT_REFERENCE_IMAGE_URL,
  useRunware: true,
  locale: "en" as const,
  out: path.join(".", "tmp", `profile-composite-test-${String(Date.now())}.png`),
  name: "Asuma",
  location: "Osaka",
  tags: ["anime", "selfie"],
  badge: "TOP PICK",
  age: 21,
  university: "Pumpbridge University",
  distanceKm: 10,
} as const;

function usage(): string {
  return [
    "Usage:",
    "  bun run scripts/test-profile-image-composite.ts [options]",
    "",
    "Options:",
    `  --reference <url-or-file>    Reference face image source. Default: ${DEFAULT_REFERENCE_IMAGE_URL}`,
    "  --use-runware <true|false>   Run Runware generation for character/background. Default: true",
    "  --locale <ja|en>             Prompt locale for Runware generation. Default: en",
    "  --seed <number>              Optional generation seed.",
    "  --character <url-or-file>    Override character image source directly (skip Runware character).",
    "  --background <url-or-file>   Override background image source directly (skip Runware background).",
    "  --out <file>                 Output png path. Default: ./tmp/profile-composite-test-<timestamp>.png",
    "  --name <text>                Display name on card.",
    "  --location <text>            Display location on card.",
    "  --tags <csv>                 Comma-separated tags.",
    "  --badge <text>               Badge text.",
    "  --age <number>               Age overlay.",
    "  --university <text>          University overlay.",
    "  --distance-km <number>       Distance overlay.",
    "  --frame-color <hex>          Frame border color (e.g. #FD5068).",
    "  --frame-width <number>       Frame border width.",
    "  --frame-radius <number>      Frame border radius.",
    "",
    "Examples:",
    "  bun run scripts/test-profile-image-composite.ts",
    "  bun run scripts/test-profile-image-composite.ts --use-runware false --character ./tmp/char.png",
    "  bun run scripts/test-profile-image-composite.ts --reference https://... --seed 42 --out ./tmp/result.png",
  ].join("\n");
}

function parseArgs(argv: string[]): CliOptions {
  const map = new Map<string, string>();
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const value = argv[i + 1];
    if (!value || value.startsWith("--")) {
      throw new Error(`Missing value for --${key}`);
    }
    map.set(key, value);
    i += 1;
  }

  const localeRaw = map.get("locale") ?? DEFAULTS.locale;
  if (localeRaw !== "ja" && localeRaw !== "en") {
    throw new Error("--locale must be ja or en");
  }

  const useRunwareRaw = map.get("use-runware") ?? String(DEFAULTS.useRunware);
  if (useRunwareRaw !== "true" && useRunwareRaw !== "false") {
    throw new Error("--use-runware must be true or false");
  }

  const ageRaw = map.get("age") ?? String(DEFAULTS.age);
  const distanceRaw = map.get("distance-km") ?? String(DEFAULTS.distanceKm);
  const seedRaw = map.get("seed");

  return {
    reference: map.get("reference") ?? DEFAULTS.reference,
    useRunware: useRunwareRaw === "true",
    locale: localeRaw,
    seed: seedRaw ? Number(seedRaw) : undefined,
    character: map.get("character"),
    background: map.get("background"),
    out: map.get("out") ?? DEFAULTS.out,
    name: map.get("name") ?? DEFAULTS.name,
    location: map.get("location") ?? DEFAULTS.location,
    tags: (map.get("tags") ?? DEFAULTS.tags.join(","))
      .split(",")
      .map(v => v.trim())
      .filter(Boolean),
    badge: map.get("badge") ?? DEFAULTS.badge,
    age: Number(ageRaw),
    university: map.get("university") ?? DEFAULTS.university,
    distanceKm: Number(distanceRaw),
    frameColor: map.get("frame-color"),
    frameWidth: map.get("frame-width") ? Number(map.get("frame-width")) : undefined,
    frameRadius: map.get("frame-radius") ? Number(map.get("frame-radius")) : undefined,
  };
}

function contentTypeFromPath(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".webp") return "image/webp";
  return "application/octet-stream";
}

function toDataUrl(bytes: Uint8Array, contentType: string): string {
  return `data:${contentType};base64,${Buffer.from(bytes).toString("base64")}`;
}

async function sourceToDataUrl(source: string): Promise<string> {
  if (source.startsWith("data:")) {
    return source;
  }

  if (source.startsWith("http://") || source.startsWith("https://")) {
    const response = await fetch(source, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Failed to fetch "${source}" (${String(response.status)})`);
    }
    const bytes = new Uint8Array(await response.arrayBuffer());
    const contentType = (response.headers.get("content-type") ?? "image/png").split(";")[0]?.trim() || "image/png";
    return toDataUrl(bytes, contentType);
  }

  const resolved = path.resolve(source);
  if (!existsSync(resolved)) {
    throw new Error(`File not found: ${resolved}`);
  }

  const bytes = new Uint8Array(await readFile(resolved));
  return toDataUrl(bytes, contentTypeFromPath(resolved));
}

async function runRunwareImageInference(options: {
  positivePrompt: string;
  seed?: number;
  referenceImageUrl?: string;
}): Promise<string> {
  const apiKey = process.env.RUNWARE_API_KEY;
  if (!apiKey) {
    throw new Error("RUNWARE_API_KEY is required when --use-runware true");
  }

  const model = process.env.RUNWARE_MODEL ?? DEFAULT_RUNWARE_MODEL;

  const taskPayload: Record<string, unknown> = {
    taskType: "imageInference",
    taskUUID: crypto.randomUUID(),
    model,
    positivePrompt: options.positivePrompt,
    width: RUNWARE_PROFILE_IMAGE_SIZE.width,
    height: RUNWARE_PROFILE_IMAGE_SIZE.height,
    numberResults: RUNWARE_PROFILE_NUM_RESULTS,
    outputFormat: RUNWARE_PROFILE_OUTPUT_FORMAT,
    steps: RUNWARE_PROFILE_STEPS,
    CFGScale: RUNWARE_PROFILE_CFG,
    seed: options.seed,
  };
  if (RUNWARE_PROFILE_NEGATIVE_PROMPT.trim().length > 0) {
    taskPayload.negativePrompt = RUNWARE_PROFILE_NEGATIVE_PROMPT;
  }

  if (options.referenceImageUrl) {
    taskPayload.inputs = { referenceImages: [options.referenceImageUrl] };
  }

  const response = await fetch("https://api.runware.ai/v1", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify([taskPayload]),
    cache: "no-store",
    signal: AbortSignal.timeout(25_000),
  });

  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const detail =
      payload &&
      typeof payload === "object" &&
      "message" in payload &&
      typeof (payload as Record<string, unknown>).message === "string" ?
        ((payload as Record<string, unknown>).message as string)
      : null;
    throw new Error(`Runware request failed (${String(response.status)})${detail ? `: ${detail}` : ""}`);
  }

  if (!payload || typeof payload !== "object" || !("data" in payload) || !Array.isArray(payload.data)) {
    throw new Error("Runware response has invalid shape");
  }

  const first = (payload as { data: unknown[] }).data[0];
  if (!first || typeof first !== "object") {
    throw new Error("Runware response has no image result");
  }

  const imageUrl =
    typeof (first as Record<string, unknown>).imageURL === "string" ?
      ((first as Record<string, unknown>).imageURL as string)
    : typeof (first as Record<string, unknown>).imageUrl === "string" ?
      ((first as Record<string, unknown>).imageUrl as string)
    : null;

  if (!imageUrl) {
    throw new Error("Runware response does not contain image URL");
  }

  return imageUrl;
}

async function resolveCharacterDataUrl(options: CliOptions): Promise<{
  dataUrl: string;
  source: string;
  runwareImageUrl?: string;
  runwareReferenceMode?: "data-url" | "remote-url";
}> {
  if (options.character) {
    const dataUrl = await sourceToDataUrl(options.character);
    return { dataUrl, source: options.character };
  }

  if (!options.useRunware) {
    const normalizedReference = normalizeRunwareReferenceImageUrl(options.reference);
    const dataUrl = await sourceToDataUrl(normalizedReference);
    return { dataUrl, source: normalizedReference };
  }

  const normalizedReference = normalizeRunwareReferenceImageUrl(options.reference);
  const prompt = buildRunwareProfilePrompt({
    locale: options.locale,
    displayName: options.name,
    xUsername: null,
  });

  let generatedUrl: string;
  let runwareReferenceMode: "data-url" | "remote-url" = "remote-url";
  if (normalizedReference.startsWith("http://") || normalizedReference.startsWith("https://")) {
    generatedUrl = await runRunwareImageInference({
      positivePrompt: prompt,
      seed: options.seed,
      referenceImageUrl: normalizedReference,
    });
  } else {
    const referenceDataUrl = await sourceToDataUrl(normalizedReference);
    generatedUrl = await runRunwareImageInference({
      positivePrompt: prompt,
      seed: options.seed,
      referenceImageUrl: referenceDataUrl,
    });
    runwareReferenceMode = "data-url";
  }
  const dataUrl = await sourceToDataUrl(generatedUrl);
  return {
    dataUrl,
    source: normalizedReference,
    runwareImageUrl: generatedUrl,
    runwareReferenceMode,
  };
}

async function resolveBackgroundDataUrl(options: CliOptions): Promise<{ dataUrl?: string; source?: string; runwareImageUrl?: string }> {
  if (options.background) {
    const dataUrl = await sourceToDataUrl(options.background);
    return { dataUrl, source: options.background };
  }

  if (!options.useRunware) {
    return {};
  }

  try {
    const generatedUrl = await runRunwareImageInference({
      positivePrompt: RUNWARE_PROFILE_BACKGROUND_PROMPT,
      seed: options.seed,
    });
    const dataUrl = await sourceToDataUrl(generatedUrl);
    return {
      dataUrl,
      source: "runware-background",
      runwareImageUrl: generatedUrl,
    };
  } catch {
    return {};
  }
}

async function run(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));

  if (!Number.isFinite(options.age)) {
    throw new TypeError("--age must be a number");
  }
  if (!Number.isFinite(options.distanceKm)) {
    throw new TypeError("--distance-km must be a number");
  }
  if (options.seed !== undefined && !Number.isFinite(options.seed)) {
    throw new Error("--seed must be a number");
  }
  if (options.frameWidth !== undefined && !Number.isFinite(options.frameWidth)) {
    throw new Error("--frame-width must be a number");
  }
  if (options.frameRadius !== undefined && !Number.isFinite(options.frameRadius)) {
    throw new Error("--frame-radius must be a number");
  }

  const character = await resolveCharacterDataUrl(options);
  const background = await resolveBackgroundDataUrl(options);

  const frame =
    options.frameColor !== undefined || options.frameWidth !== undefined || options.frameRadius !== undefined ?
      {
        ...(options.frameColor !== undefined ? { borderColor: options.frameColor } : {}),
        ...(options.frameWidth !== undefined ? { borderWidth: options.frameWidth } : {}),
        ...(options.frameRadius !== undefined ? { borderRadius: options.frameRadius } : {}),
      }
    : undefined;

  const composite = createTinderProfileCompositeImage({
    characterImageUrl: character.dataUrl,
    backgroundImageUrl: background.dataUrl,
    name: options.name,
    location: options.location,
    tags: options.tags,
    badge: options.badge,
    age: options.age,
    university: options.university,
    distanceKm: options.distanceKm,
    frame,
  });

  const outputPath = path.resolve(options.out);
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, new Uint8Array(await composite.arrayBuffer()));

  console.log(`Composite image saved: ${outputPath}`);
  console.log(
    JSON.stringify(
      {
        output: outputPath,
        useRunware: options.useRunware,
        reference: options.reference,
        characterSource: character.source,
        characterRunwareImageUrl: character.runwareImageUrl ?? null,
        characterRunwareReferenceMode: character.runwareReferenceMode ?? null,
        backgroundSource: background.source ?? null,
        backgroundRunwareImageUrl: background.runwareImageUrl ?? null,
        size: {
          width: 651,
          height: 1101,
        },
      },
      null,
      2,
    ),
  );
}

try {
  await run();
} catch (error) {
  console.error(error instanceof Error ? error.message : "Unknown error");
  console.error("");
  console.error(usage());
  process.exit(1);
}
