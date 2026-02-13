import { NextResponse } from "next/server";

import { pointService } from "@/infrastructure/points-container";
import { leaderboardResponseSchema } from "@/interfaces/schemas/points";

// Note: export const runtime = "edge" is not supported by @opennextjs/cloudflare
export const dynamic = "force-dynamic";

const LEADERBOARD_LIMIT = 20;

export async function GET() {
  try {
    const leaderboard = await pointService.getLeaderboard(LEADERBOARD_LIMIT);

    const payload = leaderboardResponseSchema.parse({
      generatedAt: leaderboard.generatedAt.toISOString(),
      dailyWindow: {
        start: leaderboard.dailyWindow.start.toISOString(),
        end: leaderboard.dailyWindow.end.toISOString(),
        timezone: leaderboard.dailyWindow.timezone,
      },
      total: leaderboard.total,
      daily: leaderboard.daily,
    });

    return NextResponse.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ message }, { status: 500 });
  }
}
