import { NextResponse } from "next/server";

import { pointService } from "@/infrastructure/points-container";
import { getServerSession } from "@/lib/auth/server-session";

// Note: export const runtime = "edge" is not supported by @opennextjs/cloudflare
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession();
  const userId = session?.user.id;

  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const snapshot = await pointService.getMyPoints(userId);
  return NextResponse.json(snapshot);
}
