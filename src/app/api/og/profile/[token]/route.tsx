import { env } from "@/env";
import { createTinderProfileCompositeImage, TINDER_PROFILE_COMPOSITE_SIZE } from "@/lib/profile-image/tinder-composite";
import { decodeProfileShareToken } from "@/lib/profile-share";

export const runtime = "nodejs";
export const contentType = "image/png";
export const size = {
  width: TINDER_PROFILE_COMPOSITE_SIZE.width,
  height: TINDER_PROFILE_COMPOSITE_SIZE.height,
};

export async function GET(_request: Request, context: { params: Promise<{ token: string }> }) {
  if (!env.BETTER_AUTH_SECRET) {
    return new Response("Share secret is not configured", { status: 500 });
  }

  const { token } = await context.params;
  const decoded = decodeProfileShareToken(token, env.BETTER_AUTH_SECRET);
  if (!decoded) {
    return new Response("Invalid token", { status: 400 });
  }

  return createTinderProfileCompositeImage({
    imageUrl: decoded.imageUrl,
    name: decoded.name,
    location: decoded.location,
    tags: decoded.tags,
    badge: "NEW",
  });
}
