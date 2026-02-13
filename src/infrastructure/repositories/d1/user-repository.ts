import type { UserRepository, UserSummary } from "@/domain/repositories/user-repository";
import { and, eq } from "drizzle-orm";

import { getDb } from "@/infrastructure/db/client";
import { user, walletAddress } from "@/infrastructure/db/schema";

export class D1UserRepository implements UserRepository {
  async findById(userId: string): Promise<UserSummary | null> {
    const db = await getDb();

    const baseUserRows = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
      })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (baseUserRows.length === 0) {
      return null;
    }

    const walletRows = await db
      .select({
        type: walletAddress.type,
        address: walletAddress.address,
        chainId: walletAddress.chainId,
        isPrimary: walletAddress.isPrimary,
      })
      .from(walletAddress)
      .where(eq(walletAddress.userId, userId));

    return {
      ...baseUserRows[0],
      walletAddresses: walletRows,
    };
  }

  async findByWalletAddress(address: string): Promise<UserSummary | null> {
    const db = await getDb();

    const rows = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
      })
      .from(walletAddress)
      .innerJoin(user, eq(user.id, walletAddress.userId))
      .where(and(eq(walletAddress.address, address), eq(walletAddress.type, "svm")))
      .limit(1);

    if (rows.length === 0) {
      return null;
    }

    const walletRows = await db
      .select({
        type: walletAddress.type,
        address: walletAddress.address,
        chainId: walletAddress.chainId,
        isPrimary: walletAddress.isPrimary,
      })
      .from(walletAddress)
      .where(eq(walletAddress.userId, rows[0].id));

    return {
      id: rows[0].id,
      name: rows[0].name,
      email: rows[0].email,
      walletAddresses: walletRows,
    };
  }
}
