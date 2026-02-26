import { NextResponse } from "next/server";
import { z } from "zod";

import { D1ProfileImageRepository } from "@/infrastructure/repositories/d1/profile-image-repository";
import { uploadProfileCompositeImageToR2 } from "@/infrastructure/storage/r2/profile-image-storage";
import { getServerSession } from "@/lib/auth/server-session";
import { createTinderProfileCompositeImage } from "@/lib/profile-image/tinder-composite";
import { pickRandomProfileDecorations } from "@/lib/profile-share";
import { generateProfileBackgroundWithRunware, generateProfileImageWithRunware } from "@/lib/runware/profile-image";
import { logger } from "@/utils/logger";

const requestSchema = z.object({
  locale: z.enum(["ja", "en"]).default("en"),
  seed: z.number().int().min(0).optional(),
  frame: z
    .object({
      borderColor: z.string().max(32).optional(),
      borderWidth: z.number().int().min(1).max(24).optional(),
      borderRadius: z.number().int().min(8).max(64).optional(),
    })
    .optional(),
});

function maskUserId(userId: string): string {
  if (userId.length <= 10) return userId;
  return `${userId.slice(0, 6)}...${userId.slice(-4)}`;
}

function maskImageUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.origin}${parsed.pathname.slice(0, 20)}...`;
  } catch {
    return "invalid-url";
  }
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

async function fetchGeneratedImageAsDataUrl(imageUrl: string): Promise<string> {
  const response = await fetch(imageUrl, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch generated image (${String(response.status)})`);
  }

  const imageBytes = await response.arrayBuffer();
  if (imageBytes.byteLength === 0) {
    throw new Error("Generated image bytes are empty");
  }

  const rawContentType = response.headers.get("content-type") ?? "image/png";
  const contentType =
    rawContentType.startsWith("image/") ? rawContentType.split(";")[0]?.trim() || "image/png" : "image/png";
  const base64 = arrayBufferToBase64(imageBytes);
  return `data:${contentType};base64,${base64}`;
}

export async function POST(request: Request) {
  const requestId = crypto.randomUUID().slice(0, 8);
  const startedAt = Date.now();
  logger.info("[profile-image] request start", {
    requestId,
    method: request.method,
    path: "/api/profile-image/generate",
  });

  const session = await getServerSession();
  const userId = session?.user.id;

  if (!userId) {
    logger.warn("[profile-image] unauthorized", { requestId });
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const rawBody: unknown = await request.json().catch(() => ({}));
  const parsed = requestSchema.safeParse(rawBody);
  if (!parsed.success) {
    logger.warn("[profile-image] invalid request body", {
      requestId,
      userId: maskUserId(userId),
      issues: parsed.error.issues.map(issue => ({
        path: issue.path.join("."),
        code: issue.code,
        message: issue.message,
      })),
    });
    return NextResponse.json({ message: "Invalid request" }, { status: 400 });
  }

  const repository = new D1ProfileImageRepository();
  const context = await repository.getGenerationContext(userId);
  if (!context) {
    logger.warn("[profile-image] user context not found", {
      requestId,
      userId: maskUserId(userId),
    });
    return NextResponse.json({ message: "User not found" }, { status: 404 });
  }

  if (!context.xProfileImageUrl) {
    logger.warn("[profile-image] missing x profile image", {
      requestId,
      userId: maskUserId(userId),
      locale: parsed.data.locale,
      hasXUsername: Boolean(context.xUsername),
    });
    return NextResponse.json({ message: "X profile image is required" }, { status: 409 });
  }

  try {
    logger.info("[profile-image] generation start", {
      requestId,
      userId: maskUserId(userId),
      locale: parsed.data.locale,
      hasSeed: parsed.data.seed !== undefined,
      hasXUsername: Boolean(context.xUsername),
      usernameLength: context.username?.length ?? 0,
      xProfileImage: maskImageUrl(context.xProfileImageUrl),
    });

    const seed = parsed.data.seed;

    const [backgroundResult, characterResult] = await Promise.all([
      generateProfileBackgroundWithRunware({ seed }),
      generateProfileImageWithRunware({
        locale: parsed.data.locale,
        seed,
        inputFaceImageUrl: context.xProfileImageUrl,
        displayName: context.username ?? "guest",
        xUsername: context.xUsername,
      }),
    ]);

    const sessionName = typeof session.user.name === "string" ? session.user.name.trim() : "";
    const displayName = context.username?.trim() || sessionName || "Guest";
    const decorations = pickRandomProfileDecorations();
    logger.info("[profile-image] composite start", {
      requestId,
      userId: maskUserId(userId),
      displayNameLength: displayName.length,
      badge: decorations.badge,
      location: decorations.location,
      tagsCount: decorations.tags.length,
    });

    const [backgroundDataUrl, characterDataUrl] = await Promise.all([
      fetchGeneratedImageAsDataUrl(backgroundResult.imageUrl),
      fetchGeneratedImageAsDataUrl(characterResult.imageUrl),
    ]);

    const compositeImage = createTinderProfileCompositeImage({
      backgroundImageUrl: backgroundDataUrl,
      characterImageUrl: characterDataUrl,
      name: displayName,
      location: decorations.location,
      tags: decorations.tags,
      badge: decorations.badge,
      frame: parsed.data.frame,
    });

    const compositeBytes = await compositeImage.arrayBuffer();
    const uploaded = await uploadProfileCompositeImageToR2({
      userId,
      imageBytes: compositeBytes,
      contentType: "image/png",
    });

    await repository.updateGeneratedProfileImage(userId, uploaded.publicUrl);
    logger.info("[profile-image] generation success", {
      requestId,
      userId: maskUserId(userId),
      imageUrl: maskImageUrl(uploaded.publicUrl),
      durationMs: Date.now() - startedAt,
    });
    return NextResponse.json({ imageUrl: uploaded.publicUrl });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate profile image";
    logger.error("[profile-image] generation failed", {
      requestId,
      userId: maskUserId(userId),
      locale: parsed.data.locale,
      durationMs: Date.now() - startedAt,
      message,
    });
    if (error instanceof Error && error.stack) {
      logger.debug("[profile-image] generation stack", {
        requestId,
        stack: error.stack,
      });
    }
    return NextResponse.json({ message }, { status: 502 });
  }
}
