import { NextResponse } from "next/server";

import { D1XAccountRepository } from "@/infrastructure/repositories/d1/x-account-repository";
import { getServerSession } from "@/lib/auth/server-session";

export async function GET(_request: Request) {
  const session = await getServerSession();
  const userId = session?.user.id;

  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const repository = new D1XAccountRepository();
  const hasWallet = await repository.hasSvmWallet(userId);

  if (!hasWallet) {
    return NextResponse.json({ message: "Wallet authentication required", linked: false }, { status: 403 });
  }

  const twitterAccount = await repository.findTwitterAccountByUserId(userId);
  if (!twitterAccount) {
    return NextResponse.json({ linked: false });
  }

  const linkedAccount = await repository.upsertFromTwitterAccount({
    userId,
    accountId: twitterAccount.id,
    providerAccountId: twitterAccount.accountId,
  });

  return NextResponse.json({
    linked: true,
    providerAccountId: linkedAccount.providerAccountId,
    username: linkedAccount.username,
  });
}
