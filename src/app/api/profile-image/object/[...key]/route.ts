import { getObjectR2 } from "@/lib/r2";
import { resolveProfileImagesBucket } from "@/infrastructure/storage/r2/profile-image-storage";

function decodeR2KeyPath(parts: string[]): string {
  return parts.map(segment => decodeURIComponent(segment)).join("/");
}

export async function GET(_request: Request, context: { params: Promise<{ key: string[] }> }) {
  const { key: keyParts } = await context.params;
  if (!Array.isArray(keyParts) || keyParts.length === 0) {
    return new Response("Invalid key", { status: 400 });
  }

  const objectKey = decodeR2KeyPath(keyParts);
  const bucket = await resolveProfileImagesBucket();
  const objectResult = await getObjectR2(bucket, objectKey);
  if (!objectResult.isOk) {
    return new Response(objectResult.error.message, { status: 500 });
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
