import { env } from "@/env";
import { joinR2Key, putImageR2, resolveBucketOrThrowAsync } from "@/lib/r2";

function sanitizePathSegment(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, "_");
}

function extensionFromContentType(contentType: string): string {
  switch (contentType.toLowerCase()) {
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/jpeg":
      return "jpg";
    default:
      return "bin";
  }
}

function buildPublicUrl(key: string): string {
  const baseUrl = env.R2_PROFILE_IMAGE_PUBLIC_BASE_URL;
  if (baseUrl) {
    const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
    return new URL(key, normalizedBase).toString();
  }

  throw new Error("R2_PROFILE_IMAGE_PUBLIC_BASE_URL is not configured");
}

export async function resolveProfileImagesBucket(): Promise<R2Bucket> {
  return resolveBucketOrThrowAsync({
    bindingName: "PROFILE_IMAGES_BUCKET",
    fallbackBindingName: "R2_BUCKET",
    errorContext: "PROFILE_IMAGES_BUCKET binding is not available",
  });
}

export interface UploadProfileCompositeImageToR2Input {
  userId: string;
  imageBytes: ArrayBuffer;
  contentType: string;
}

export interface UploadProfileCompositeImageToR2Result {
  key: string;
  publicUrl: string;
}

export async function uploadProfileCompositeImageToR2(
  input: UploadProfileCompositeImageToR2Input,
): Promise<UploadProfileCompositeImageToR2Result> {
  const bucket = await resolveProfileImagesBucket();

  const now = new Date();
  const dateKey = now.toISOString().slice(0, 10);
  const userKey = sanitizePathSegment(input.userId);
  const extension = extensionFromContentType(input.contentType);
  const key = joinR2Key(["profile-image", userKey, dateKey, `${crypto.randomUUID()}.${extension}`]);

  const putResult = await putImageR2(bucket, key, input.imageBytes, input.contentType);
  if (!putResult.isOk) {
    throw new Error(putResult.error.message);
  }

  return {
    key,
    publicUrl: buildPublicUrl(key),
  };
}
