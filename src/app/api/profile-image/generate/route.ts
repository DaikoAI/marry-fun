import { NextResponse } from "next/server";
import { z } from "zod";

import { D1ProfileImageRepository } from "@/infrastructure/repositories/d1/profile-image-repository";
import { uploadProfileCompositeImageToR2 } from "@/infrastructure/storage/r2/profile-image-storage";
import { getServerSession } from "@/lib/auth/server-session";
import { createTinderProfileCompositeImage } from "@/lib/profile-image/tinder-composite";
import { pickRandomProfileDecorations } from "@/lib/profile-share";
import { generateProfileImageWithRunware } from "@/lib/runware/profile-image";
import { logger } from "@/utils/logger";

const requestSchema = z.object({
  locale: z.enum(["ja", "en"]).default("en"),
  seed: z.number().int().min(0).optional(),
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

    const result = await generateProfileImageWithRunware({
      locale: parsed.data.locale,
      seed: parsed.data.seed,
      inputFaceImageUrl: context.xProfileImageUrl,
      displayName: context.username ?? "guest",
      xUsername: context.xUsername,
    });

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

    const compositeImage = createTinderProfileCompositeImage({
      imageUrl: result.imageUrl,
      name: displayName,
      location: decorations.location,
      tags: decorations.tags,
      badge: decorations.badge,
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
