import {
  buildRunwareProfilePrompt,
  normalizeRunwareReferenceImageUrl,
  RUNWARE_PROFILE_CFG,
  RUNWARE_PROFILE_IMAGE_SIZE,
  RUNWARE_PROFILE_MODEL_DEFAULT,
  RUNWARE_PROFILE_NEGATIVE_PROMPT,
  RUNWARE_PROFILE_NUM_RESULTS,
  RUNWARE_PROFILE_OUTPUT_FORMAT,
  RUNWARE_PROFILE_STEPS,
} from "@/constants/profile-image/runware";
import { logger } from "@/utils/logger";

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

export function pickRunwareImageUrlFromResponse(payload: unknown): string | null {
  if (!payload || typeof payload !== "object" || !("data" in payload) || !Array.isArray(payload.data)) {
    return null;
  }

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
        return candidate;
      }
    } catch {
      continue;
    }
  }

  return null;
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
    const startedAt = Date.now();
    const prompt = buildRunwareProfilePrompt({
      locale: input.locale,
      displayName: input.displayName,
      xUsername: input.xUsername,
    });
    const normalizedFaceImageUrl = normalizeRunwareReferenceImageUrl(input.inputFaceImageUrl);

    const body = [
      {
        taskType: "imageInference",
        taskUUID: crypto.randomUUID(),
        model,
        positivePrompt: prompt,
        negativePrompt: RUNWARE_PROFILE_NEGATIVE_PROMPT,
        width: RUNWARE_PROFILE_IMAGE_SIZE.width,
        height: RUNWARE_PROFILE_IMAGE_SIZE.height,
        numberResults: RUNWARE_PROFILE_NUM_RESULTS,
        outputFormat: RUNWARE_PROFILE_OUTPUT_FORMAT,
        steps: RUNWARE_PROFILE_STEPS,
        CFGScale: RUNWARE_PROFILE_CFG,
        inputs: {
          referenceImages: [normalizedFaceImageUrl],
        },
        seed: input.seed,
      },
    ];

    logger.debug("[runware] request start", {
      traceId,
      model,
      taskType: "imageInference",
      locale: input.locale,
      promptLength: prompt.length,
      hasSeed: input.seed !== undefined,
      width: RUNWARE_PROFILE_IMAGE_SIZE.width,
      height: RUNWARE_PROFILE_IMAGE_SIZE.height,
      inputFaceImage: redactImageUrl(input.inputFaceImageUrl),
      normalizedInputFaceImage: redactImageUrl(normalizedFaceImageUrl),
    });

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
      });
    } catch (error) {
      logger.error("[runware] network failure", {
        traceId,
        model,
        durationMs: Date.now() - startedAt,
        message: error instanceof Error ? error.message : "unknown fetch error",
      });
      throw error;
    }

    const payload: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      const detail = readRunwareErrorMessage(payload);
      logger.warn("[runware] request failed", {
        traceId,
        model,
        status: response.status,
        durationMs: Date.now() - startedAt,
        detail,
      });
      throw new Error(`Runware request failed with status ${String(response.status)}${detail ? `: ${detail}` : ""}`);
    }

    const imageUrl = pickRunwareImageUrlFromResponse(payload);
    if (!imageUrl) {
      logger.warn("[runware] missing image url in response", {
        traceId,
        model,
        status: response.status,
        durationMs: Date.now() - startedAt,
      });
      throw new Error("Runware response does not contain image URL");
    }

    logger.info("[runware] request success", {
      traceId,
      model,
      status: response.status,
      durationMs: Date.now() - startedAt,
      imageUrl: redactImageUrl(imageUrl),
    });
    return { imageUrl };
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
