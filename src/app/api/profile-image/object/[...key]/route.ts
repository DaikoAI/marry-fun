import { getObjectR2 } from "@/lib/r2";
import { resolveProfileImagesBucket } from "@/infrastructure/storage/r2/profile-image-storage";
import { logger } from "@/utils/logger";

function decodeR2KeyPath(parts: string[]): string | null {
  try {
    return parts.map(segment => decodeURIComponent(segment)).join("/");
  } catch {
    return null;
  }
}

export async function GET(_request: Request, context: { params: Promise<{ key: string[] }> }) {
  const { key: keyParts } = await context.params;
  if (!Array.isArray(keyParts) || keyParts.length === 0) {
    return new Response("Invalid key", { status: 400 });
  }

  const objectKey = decodeR2KeyPath(keyParts);
  if (!objectKey) {
    return new Response("Invalid key", { status: 400 });
  }
  const bucket = await resolveProfileImagesBucket();
  const objectResult = await getObjectR2(bucket, objectKey);
  if (!objectResult.isOk) {
    logger.error("[profile-image/object] failed to fetch object", {
      key: objectKey,
      error: objectResult.error,
    });
    return new Response("Failed to load object", { status: 500 });
  }

  const object = objectResult.value;
  if (!object) {
    return new Response("Not found", { status: 404 });
  }

  const contentType = object.httpMetadata?.contentType ?? "application/octet-stream";
  const cacheControl = object.httpMetadata?.cacheControl ?? "public, max-age=31536000, immutable";
  return new Response(object.body, {
    headers: {
      "content-type": contentType,
      "cache-control": cacheControl,
      etag: object.httpEtag,
    },
  });
}
