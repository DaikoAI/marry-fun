import { NextResponse } from "next/server";
import { z } from "zod";

import { env } from "@/env";
import { D1ProfileImageRepository } from "@/infrastructure/repositories/d1/profile-image-repository";
import { getServerSession } from "@/lib/auth/server-session";
import { buildProfileShareIntentUrl, createProfileShareToken, pickDailyProfileDecorations } from "@/lib/profile-share";

const requestSchema = z.object({
  locale: z.enum(["ja", "en"]).default("en"),
});

export async function POST(request: Request) {
  const session = await getServerSession();
  const userId = session?.user.id;

  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const parsed = requestSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid request" }, { status: 400 });
  }

  const profileShareTokenSecret = env.PROFILE_SHARE_TOKEN_SECRET;
  if (!profileShareTokenSecret) {
    return NextResponse.json({ message: "Profile share secret is not configured" }, { status: 500 });
  }

  const repository = new D1ProfileImageRepository();
  const context = await repository.getGenerationContext(userId);
  if (!context?.userImage) {
    return NextResponse.json({ message: "Generated profile image is required" }, { status: 409 });
  }

  const dateKey = new Date().toISOString().slice(0, 10);
  const decorations = pickDailyProfileDecorations({
    userId,
    dateKey,
  });
  const sessionName = typeof session.user.name === "string" ? session.user.name.trim() : "";
  const name = context.username?.trim() || sessionName || "Guest";
  const token = createProfileShareToken(
    {
      userId,
      locale: parsed.data.locale,
      imageUrl: context.userImage,
      name,
      location: decorations.location,
      tags: decorations.tags,
    },
    profileShareTokenSecret,
  );

  const shareUrl = `${new URL(request.url).origin}/${parsed.data.locale}/profile-share/${token}`;
  const text =
    parsed.data.locale === "ja" ?
      `${name}のTinder風プロフィールが完成。#marryfun`
    : `${name}'s Tinder-style profile is ready. #marryfun`;
  const intentUrl = buildProfileShareIntentUrl({ text, url: shareUrl });

  return NextResponse.json({
    shareUrl,
    intentUrl,
  });
}
