import { and, eq } from "drizzle-orm";

import { getDb } from "@/infrastructure/db/client";
import { account, walletAddress, xAccount } from "@/infrastructure/db/schema";

interface TwitterAccountSummary {
  id: string;
  accountId: string;
}

interface UpsertXAccountInput {
  userId: string;
  accountId: string;
  providerAccountId: string;
}

interface XAccountSummary {
  providerAccountId: string;
  username: string | null;
}

export class D1XAccountRepository {
  async hasSvmWallet(userId: string): Promise<boolean> {
    const db = await getDb();
    const rows = await db
      .select({ id: walletAddress.id })
      .from(walletAddress)
      .where(and(eq(walletAddress.userId, userId), eq(walletAddress.type, "svm")))
      .limit(1);

    return rows.length > 0;
  }

  async findTwitterAccountByUserId(userId: string): Promise<TwitterAccountSummary | null> {
    const db = await getDb();
    const rows = await db
      .select({
        id: account.id,
        accountId: account.accountId,
      })
      .from(account)
      .where(and(eq(account.userId, userId), eq(account.providerId, "twitter")))
      .limit(1);

    return rows[0] ?? null;
  }

  async upsertFromTwitterAccount(input: UpsertXAccountInput): Promise<XAccountSummary> {
    const db = await getDb();
    const now = new Date();

    await db
      .insert(xAccount)
      .values({
        id: crypto.randomUUID(),
        userId: input.userId,
        accountId: input.accountId,
        providerAccountId: input.providerAccountId,
        username: null,
        linkedAt: now,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: xAccount.userId,
        set: {
          accountId: input.accountId,
          providerAccountId: input.providerAccountId,
          linkedAt: now,
          updatedAt: now,
        },
      });

    const rows = await db
      .select({
        providerAccountId: xAccount.providerAccountId,
        username: xAccount.username,
      })
      .from(xAccount)
      .where(eq(xAccount.userId, input.userId))
      .limit(1);

    if (rows[0]) {
      return rows[0];
    }

    return {
      providerAccountId: input.providerAccountId,
      username: null,
    };
  }
}
