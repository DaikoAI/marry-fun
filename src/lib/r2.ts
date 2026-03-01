import { getCloudflareContext } from "@opennextjs/cloudflare";
import { cache } from "react";

export interface R2AppError {
  type: "InternalError" | "StorageError";
  message: string;
  cause?: unknown;
  op?: "put" | "get" | "list";
  key?: string;
}

export type R2Result<T> = { isOk: true; value: T } | { isOk: false; error: R2AppError };

function ok<T>(value: T): R2Result<T> {
  return { isOk: true, value };
}

function err<T>(error: R2AppError): R2Result<T> {
  return { isOk: false, error };
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return typeof error === "string" ? error : "Unknown error";
}

export function joinR2Key(segments: string[]): string {
  return segments
    .map(segment => segment.replace(/^\/*|\/*$/g, ""))
    .filter(Boolean)
    .join("/");
}

const resolveContext = cache(() => getCloudflareContext());
const resolveContextAsync = cache(async () => getCloudflareContext({ async: true }));

function pickBucket(
  env: CloudflareEnv,
  bindingName: "R2_BUCKET" | "PROFILE_IMAGES_BUCKET",
  fallbackBindingName?: "R2_BUCKET" | "PROFILE_IMAGES_BUCKET",
): R2Bucket | null {
  const primary = env[bindingName];
  if (primary) return primary;
  if (!fallbackBindingName) return null;
  return env[fallbackBindingName] ?? null;
}

interface ResolveR2BucketOptions {
  bindingName?: "R2_BUCKET" | "PROFILE_IMAGES_BUCKET";
  fallbackBindingName?: "R2_BUCKET" | "PROFILE_IMAGES_BUCKET";
}

export function resolveR2Bucket(options: ResolveR2BucketOptions = {}): R2Result<R2Bucket> {
  try {
    const { env } = resolveContext();
    const bindingName = options.bindingName ?? "R2_BUCKET";
    const bucket = pickBucket(env, bindingName, options.fallbackBindingName);
    if (!bucket) {
      return err({
        type: "InternalError",
        message: `${bindingName} binding is not configured on Cloudflare environment`,
      });
    }
    return ok(bucket);
  } catch (error) {
    return err({
      type: "InternalError",
      message: `Failed to resolve Cloudflare context: ${getErrorMessage(error)}`,
      cause: error,
    });
  }
}

export async function resolveR2BucketAsync(options: ResolveR2BucketOptions = {}): Promise<R2Result<R2Bucket>> {
  try {
    const { env } = await resolveContextAsync();
    const bindingName = options.bindingName ?? "R2_BUCKET";
    const bucket = pickBucket(env, bindingName, options.fallbackBindingName);
    if (!bucket) {
      return err({
        type: "InternalError",
        message: `${bindingName} binding is not configured on Cloudflare environment`,
      });
    }
    return ok(bucket);
  } catch (error) {
    return err({
      type: "InternalError",
      message: `Failed to resolve Cloudflare context asynchronously: ${getErrorMessage(error)}`,
      cause: error,
    });
  }
}

interface ResolveBucketOrThrowOptions extends ResolveR2BucketOptions {
  r2Bucket?: R2Bucket;
  errorContext?: string;
}

export async function resolveBucketOrThrowAsync(options: ResolveBucketOrThrowOptions = {}): Promise<R2Bucket> {
  if (options.r2Bucket) return options.r2Bucket;

  const bucketResult = await resolveR2BucketAsync({
    bindingName: options.bindingName,
    fallbackBindingName: options.fallbackBindingName,
  });
  if (!bucketResult.isOk) {
    const prefix = options.errorContext ?? "Failed to resolve R2 bucket";
    throw new Error(`${prefix}: ${bucketResult.error.message}`);
  }

  return bucketResult.value;
}

export async function putImageR2(
  bucket: R2Bucket,
  key: string,
  buf: ArrayBuffer,
  contentType = "image/webp",
): Promise<R2Result<void>> {
  try {
    await bucket.put(key, buf, {
      httpMetadata: {
        contentType,
        cacheControl: "public, max-age=31536000, immutable",
      },
    });
    return ok(undefined);
  } catch (error) {
    return err({
      type: "StorageError",
      op: "put",
      key,
      message: `R2 image put failed: ${getErrorMessage(error)}`,
      cause: error,
    });
  }
}

export async function getObjectR2(bucket: R2Bucket, key: string): Promise<R2Result<R2ObjectBody | null>> {
  try {
    const object = await bucket.get(key);
    return ok(object);
  } catch (error) {
    return err({
      type: "StorageError",
      op: "get",
      key,
      message: `R2 object get failed: ${getErrorMessage(error)}`,
      cause: error,
    });
  }
}
