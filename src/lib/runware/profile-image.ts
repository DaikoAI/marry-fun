import {
  buildRunwareProfilePrompt,
  normalizeRunwareReferenceImageUrl,
  RUNWARE_PROFILE_BACKGROUND_PROMPT,
  RUNWARE_PROFILE_CFG,
  RUNWARE_PROFILE_IMAGE_SIZE,
  RUNWARE_PROFILE_MODEL_DEFAULT,
  RUNWARE_PROFILE_NEGATIVE_PROMPT,
  RUNWARE_PROFILE_NUM_RESULTS,
  RUNWARE_PROFILE_OUTPUT_FORMAT,
  RUNWARE_PROFILE_STEPS,
} from "@/constants/profile-image/runware";
import { logger } from "@/utils/logger";

const RUNWARE_REQUEST_TIMEOUT_MS = 25_000;
const RUNWARE_REQUEST_MAX_ATTEMPTS = 2;

interface RunwareTaskResult {
  imageURL?: unknown;
  imageUrl?: unknown;
  url?: unknown;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object") return null;
  return value as Record<string, unknown>;
}

function redactImageUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.origin}${parsed.pathname.slice(0, 24)}...`;
  } catch {
    return "invalid-url";
  }
}

function readRunwareErrorMessage(payload: unknown): string | null {
  const payloadRecord = asRecord(payload);
  if (!payloadRecord) return null;

  const data = payloadRecord.data;
  if (Array.isArray(data)) {
    const first = asRecord(data[0]);
    if (first) {
      if (typeof first.error === "string") return first.error;
      if (typeof first.message === "string") return first.message;
    }
  }

  const errors = payloadRecord.errors;
  if (Array.isArray(errors)) {
    const first = asRecord(errors[0]);
    if (first) {
      if (typeof first.message === "string") return first.message;
      if (typeof first.error === "string") return first.error;
    }
  }

  if (typeof payloadRecord.message === "string") {
    return payloadRecord.message;
  }

  return null;
}

function isRetryableRunwareFailure(status: number, detail: string | null): boolean {
  if (status === 429 || status >= 500) {
    return true;
  }

  if (status !== 400 || !detail) {
    return false;
  }

  const normalizedDetail = detail.toLowerCase();
  return (
    normalizedDetail.includes("inference error occurred while processing the request") ||
    normalizedDetail.includes("please try again")
  );
}

export function pickRunwareImageUrlFromResponse(payload: unknown): string | null {
  const urls = pickRunwareImageUrlsFromResponse(payload);
  return urls[0] ?? null;
}

/** Returns all image URLs from Runware response in task order. */
export function pickRunwareImageUrlsFromResponse(payload: unknown): string[] {
  if (!payload || typeof payload !== "object" || !("data" in payload) || !Array.isArray(payload.data)) {
    return [];
  }

  const result: string[] = [];
  for (const item of payload.data as RunwareTaskResult[]) {
    const candidate =
      typeof item.imageURL === "string" ? item.imageURL
      : typeof item.imageUrl === "string" ? item.imageUrl
      : typeof item.url === "string" ? item.url
      : null;

    if (!candidate) continue;

    try {
      const parsed = new URL(candidate);
      if (parsed.protocol === "http:" || parsed.protocol === "https:") {
        result.push(candidate);
      }
    } catch {
      // skip invalid URL
    }
  }

  return result;
}

interface RunwareImageInferenceTask {
  positivePrompt: string;
  referenceImages?: string[];
  seed?: number;
}

/** 1 回の Runware imageInference リクエストを送り、先頭の画像 URL を返す。既存実装の共通化。 */
async function requestRunwareImageInference(options: {
  apiKey: string;
  model: string;
  task: RunwareImageInferenceTask;
  traceId: string;
  logLabel?: string;
}): Promise<{ imageUrl: string }> {
  const { apiKey, model, task, traceId, logLabel = "runware" } = options;
  const startedAt = Date.now();

  const taskPayload: Record<string, unknown> = {
    taskType: "imageInference",
    taskUUID: crypto.randomUUID(),
    model,
    positivePrompt: task.positivePrompt,
    width: RUNWARE_PROFILE_IMAGE_SIZE.width,
    height: RUNWARE_PROFILE_IMAGE_SIZE.height,
    numberResults: RUNWARE_PROFILE_NUM_RESULTS,
    outputFormat: RUNWARE_PROFILE_OUTPUT_FORMAT,
    steps: RUNWARE_PROFILE_STEPS,
    CFGScale: RUNWARE_PROFILE_CFG,
    seed: task.seed,
  };
  if (RUNWARE_PROFILE_NEGATIVE_PROMPT.trim().length > 0) {
    taskPayload.negativePrompt = RUNWARE_PROFILE_NEGATIVE_PROMPT;
  }
  if (task.referenceImages?.length) {
    taskPayload.inputs = { referenceImages: task.referenceImages };
  }

  const body = [taskPayload];

  logger.debug(`[${logLabel}] request start`, {
    traceId,
    model,
    taskType: "imageInference",
    width: RUNWARE_PROFILE_IMAGE_SIZE.width,
    height: RUNWARE_PROFILE_IMAGE_SIZE.height,
    referenceImageCount: task.referenceImages?.length ?? 0,
    referenceImage:
      task.referenceImages?.[0] ? redactImageUrl(task.referenceImages[0]) : null,
  });

  for (let attempt = 1; attempt <= RUNWARE_REQUEST_MAX_ATTEMPTS; attempt += 1) {
    let response: Response;
    try {
      response = await fetch("https://api.runware.ai/v1", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
        cache: "no-store",
        signal: AbortSignal.timeout(RUNWARE_REQUEST_TIMEOUT_MS),
      });
    } catch (error) {
      const canRetry = attempt < RUNWARE_REQUEST_MAX_ATTEMPTS;
      logger[canRetry ? "warn" : "error"](`[${logLabel}] network failure`, {
        traceId,
        model,
        attempt,
        maxAttempts: RUNWARE_REQUEST_MAX_ATTEMPTS,
        durationMs: Date.now() - startedAt,
        message: error instanceof Error ? error.message : "unknown fetch error",
        willRetry: canRetry,
      });
      if (canRetry) {
        continue;
      }
      throw error;
    }

    const payload: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      const detail = readRunwareErrorMessage(payload);
      const retryable = isRetryableRunwareFailure(response.status, detail);
      const canRetry = retryable && attempt < RUNWARE_REQUEST_MAX_ATTEMPTS;

      logger.warn(`[${logLabel}] request failed`, {
        traceId,
        model,
        status: response.status,
        attempt,
        maxAttempts: RUNWARE_REQUEST_MAX_ATTEMPTS,
        durationMs: Date.now() - startedAt,
        detail,
        retryable,
        willRetry: canRetry,
      });

      if (canRetry) {
        continue;
      }
      throw new Error(`Runware request failed with status ${String(response.status)}${detail ? `: ${detail}` : ""}`);
    }

    const imageUrl = pickRunwareImageUrlFromResponse(payload);
    if (!imageUrl) {
      logger.warn(`[${logLabel}] missing image url in response`, {
        traceId,
        model,
        status: response.status,
        attempt,
        durationMs: Date.now() - startedAt,
      });
      throw new Error("Runware response does not contain image URL");
    }

    logger.info(`[${logLabel}] request success`, {
      traceId,
      model,
      status: response.status,
      attempt,
      durationMs: Date.now() - startedAt,
      imageUrl: redactImageUrl(imageUrl),
    });
    return { imageUrl };
  }

  throw new Error("Runware request failed after retry attempts");
}

export interface GenerateProfileImageWithRunwareInput {
  locale: "ja" | "en";
  seed?: number;
  inputFaceImageUrl: string;
  displayName: string;
  xUsername: string | null;
}

export async function generateProfileImageWithRunware(
  input: GenerateProfileImageWithRunwareInput,
): Promise<{ imageUrl: string }> {
  const { env } = await import("@/env");

  const apiKey = env.RUNWARE_API_KEY;
  if (!apiKey) {
    throw new Error("RUNWARE_API_KEY is not configured");
  }

  const primaryModel = env.RUNWARE_MODEL ?? RUNWARE_PROFILE_MODEL_DEFAULT;
  const traceId = crypto.randomUUID().slice(0, 8);

  const requestWithModel = async (model: string): Promise<{ imageUrl: string }> => {
    const prompt = buildRunwareProfilePrompt({
      locale: input.locale,
      displayName: input.displayName,
      xUsername: input.xUsername,
    });
    const normalizedFaceImageUrl = normalizeRunwareReferenceImageUrl(input.inputFaceImageUrl);
    logger.debug("[runware] normalized reference image", {
      traceId,
      model,
      referenceImage: redactImageUrl(normalizedFaceImageUrl),
    });

    return requestRunwareImageInference({
      apiKey,
      model,
      traceId,
      logLabel: "runware",
      task: {
        positivePrompt: prompt,
        referenceImages: [normalizedFaceImageUrl],
        seed: input.seed,
      },
    });
  };

  try {
    return await requestWithModel(primaryModel);
  } catch (error) {
    if (primaryModel !== RUNWARE_PROFILE_MODEL_DEFAULT) {
      logger.warn("[runware] retry with default model", {
        traceId,
        primaryModel,
        fallbackModel: RUNWARE_PROFILE_MODEL_DEFAULT,
        reason: error instanceof Error ? error.message : "unknown",
      });
      return requestWithModel(RUNWARE_PROFILE_MODEL_DEFAULT);
    }
    logger.error("[runware] failed without fallback", {
      traceId,
      model: primaryModel,
      message: error instanceof Error ? error.message : "unknown",
    });
    throw error;
  }
}

export interface GenerateProfileBackgroundWithRunwareInput {
  seed?: number;
}

/** 背景のみ生成（Tinder 風カード用）。参照画像なし。既存 request を共通化して利用。 */
export async function generateProfileBackgroundWithRunware(
  input: GenerateProfileBackgroundWithRunwareInput = {},
): Promise<{ imageUrl: string }> {
  const { env } = await import("@/env");

  const apiKey = env.RUNWARE_API_KEY;
  if (!apiKey) {
    throw new Error("RUNWARE_API_KEY is not configured");
  }

  const model = env.RUNWARE_MODEL ?? RUNWARE_PROFILE_MODEL_DEFAULT;
  const traceId = crypto.randomUUID().slice(0, 8);

  return requestRunwareImageInference({
    apiKey,
    model,
    traceId,
    logLabel: "runware",
    task: {
      positivePrompt: RUNWARE_PROFILE_BACKGROUND_PROMPT,
      seed: input.seed,
    },
  });
}
