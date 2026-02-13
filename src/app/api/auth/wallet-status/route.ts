import { NextResponse } from "next/server";
import { z } from "zod";

import { D1UserRepository } from "@/infrastructure/repositories/d1/user-repository";

const querySchema = z.object({
  walletAddress: z.string().regex(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/),
});

function hasValidUsername(name: string | null): boolean {
  const trimmed = name?.trim() ?? "";
  return trimmed.length >= 1 && trimmed.length <= 20;
}

export async function GET(request: Request) {
  const walletAddress = new URL(request.url).searchParams.get("walletAddress");
  const parsed = querySchema.safeParse({ walletAddress });

  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid walletAddress" }, { status: 400 });
  }

  const userRepository = new D1UserRepository();
  const existingUser = await userRepository.findByWalletAddress(parsed.data.walletAddress);

  return NextResponse.json({
    exists: Boolean(existingUser),
    requiresUsername: !hasValidUsername(existingUser?.name ?? null),
  });
}
