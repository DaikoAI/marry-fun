import { and, eq } from "drizzle-orm";

import { getDb } from "@/infrastructure/db/client";
import { account, walletAddress, xAccount } from "@/infrastructure/db/schema";

interface TwitterAccountSummary {
  id: string;
  accountId: string;
  accessToken: string | null;
}

interface UpsertXAccountInput {
  userId: string;
  accountId: string;
  providerAccountId: string;
  username?: string | null;
  profileImageUrl?: string | null;
}

interface XAccountSummary {
  providerAccountId: string;
  username: string | null;
  profileImageUrl: string | null;
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
        accessToken: account.accessToken,
      })
      .from(account)
      .where(and(eq(account.userId, userId), eq(account.providerId, "twitter")))
      .limit(1);

    return rows[0] ?? null;
  }

  async upsertFromTwitterAccount(input: UpsertXAccountInput): Promise<XAccountSummary> {
    const db = await getDb();
    const now = new Date();
    const insertValues = {
      id: crypto.randomUUID(),
      userId: input.userId,
      accountId: input.accountId,
      providerAccountId: input.providerAccountId,
      username: input.username ?? null,
      profileImageUrl: input.profileImageUrl ?? null,
      linkedAt: now,
      createdAt: now,
      updatedAt: now,
    };
    const updateSet: {
      accountId: string;
      providerAccountId: string;
      username?: string | null;
      profileImageUrl?: string | null;
      linkedAt: Date;
      updatedAt: Date;
    } = {
      accountId: input.accountId,
      providerAccountId: input.providerAccountId,
      linkedAt: now,
      updatedAt: now,
    };

    if (input.username !== undefined) {
      updateSet.username = input.username;
    }
    if (input.profileImageUrl !== undefined) {
      updateSet.profileImageUrl = input.profileImageUrl;
    }

    await db.insert(xAccount).values(insertValues).onConflictDoUpdate({
      target: xAccount.userId,
      set: updateSet,
    });

    const rows = await db
      .select({
        providerAccountId: xAccount.providerAccountId,
        username: xAccount.username,
        profileImageUrl: xAccount.profileImageUrl,
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
      profileImageUrl: null,
    };
  }
}
