import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { pointService } from "@/infrastructure/points-container";
import { addPointsRequestSchema } from "@/interfaces/schemas/points";
import { getServerSession } from "@/lib/auth/server-session";

// Note: export const runtime = "edge" is not supported by @opennextjs/cloudflare
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await getServerSession();
  const userId = session?.user.id;

  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = addPointsRequestSchema.parse(await request.json());

    const result = await pointService.addMyPoints({
      userId,
      amount: body.amount,
      reason: body.reason,
      idempotencyKey: body.idempotencyKey,
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ message: "Invalid request", issues: error.issues }, { status: 400 });
    }

    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ message }, { status: 500 });
  }
}
