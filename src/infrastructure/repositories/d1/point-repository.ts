import type {
  AddPointsInput,
  LeaderboardQuery,
  LeaderboardRecord,
  LeaderboardRows,
  PointRepository,
  PointSnapshot,
  PointTransactionRecord,
} from "@/domain/repositories/point-repository";
import { and, asc, desc, eq, gte, inArray, lt, sql } from "drizzle-orm";

import { getDb } from "@/infrastructure/db/client";
import { pointTransaction, user, userPointBalance, walletAddress } from "@/infrastructure/db/schema";

const DEFAULT_HISTORY_LIMIT = 20;
const FALLBACK_DISPLAY_NAME = "Anonymous";

function mapTransaction(row: typeof pointTransaction.$inferSelect): PointTransactionRecord {
  return {
    id: row.id,
    userId: row.userId,
    amount: row.amount,
    reason: row.reason,
    idempotencyKey: row.idempotencyKey,
    createdAt: row.createdAt,
  };
}

function toDisplayName(input: { name: string | null; walletAddress: string | null }): string {
  const trimmed = input.name?.trim();
  if (trimmed && trimmed.length > 0) {
    return trimmed;
  }

  if (input.walletAddress) {
    const address = input.walletAddress;
    if (address.length <= 10) {
      return address;
    }
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  }

  return FALLBACK_DISPLAY_NAME;
}

export class D1PointRepository implements PointRepository {
  async getSnapshot(userId: string, limit = DEFAULT_HISTORY_LIMIT): Promise<PointSnapshot> {
    const db = await getDb();

    const [balanceRows, transactions] = await Promise.all([
      db
        .select({ balance: userPointBalance.balance })
        .from(userPointBalance)
        .where(eq(userPointBalance.userId, userId))
        .limit(1),
      db
        .select()
        .from(pointTransaction)
        .where(eq(pointTransaction.userId, userId))
        .orderBy(desc(pointTransaction.createdAt))
        .limit(limit),
    ]);

    return {
      userId,
      balance: balanceRows.length > 0 ? balanceRows[0].balance : 0,
      transactions: transactions.map(mapTransaction),
    };
  }

  async addPoints(input: AddPointsInput): Promise<PointSnapshot> {
    if (!Number.isInteger(input.amount) || input.amount === 0) {
      throw new Error("amount must be a non-zero integer");
    }

    const db = await getDb();

    if (input.idempotencyKey) {
      const existingRows = await db
        .select({ id: pointTransaction.id })
        .from(pointTransaction)
        .where(eq(pointTransaction.idempotencyKey, input.idempotencyKey))
        .limit(1);

      if (existingRows.length > 0) {
        return this.getSnapshot(input.userId);
      }
    }

    const now = new Date();

    try {
      await db.insert(pointTransaction).values({
        id: crypto.randomUUID(),
        userId: input.userId,
        amount: input.amount,
        reason: input.reason,
        idempotencyKey: input.idempotencyKey ?? null,
        createdAt: now,
      });
    } catch (error) {
      // Handle duplicate idempotency key race without relying on SQL transactions.
      if (input.idempotencyKey) {
        const existingRows = await db
          .select({ id: pointTransaction.id })
          .from(pointTransaction)
          .where(eq(pointTransaction.idempotencyKey, input.idempotencyKey))
          .limit(1);

        if (existingRows.length > 0) {
          return this.getSnapshot(input.userId);
        }
      }
      throw error;
    }

    await db
      .insert(userPointBalance)
      .values({
        userId: input.userId,
        balance: input.amount,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: userPointBalance.userId,
        set: {
          balance: sql`${userPointBalance.balance} + ${input.amount}`,
          updatedAt: now,
        },
      });

    return this.getSnapshot(input.userId);
  }

  async getLeaderboard(query: LeaderboardQuery): Promise<LeaderboardRows> {
    const db = await getDb();
    const dailyPoints = sql<number>`sum(${pointTransaction.amount})`;

    const [totalRows, dailyRows] = await Promise.all([
      db
        .select({
          userId: userPointBalance.userId,
          points: userPointBalance.balance,
        })
        .from(userPointBalance)
        .orderBy(desc(userPointBalance.balance), asc(userPointBalance.userId))
        .limit(query.limit),
      db
        .select({
          userId: pointTransaction.userId,
          points: dailyPoints.as("points"),
        })
        .from(pointTransaction)
        .where(and(gte(pointTransaction.createdAt, query.dailyStart), lt(pointTransaction.createdAt, query.dailyEnd)))
        .groupBy(pointTransaction.userId)
        .having(sql`${dailyPoints} > 0`)
        .orderBy(desc(dailyPoints), asc(pointTransaction.userId))
        .limit(query.limit),
    ]);

    const userIds = [...new Set([...totalRows, ...dailyRows].map(row => row.userId))];
    if (userIds.length === 0) {
      return { total: [], daily: [] };
    }

    const [userRows, walletRows] = await Promise.all([
      db
        .select({
          userId: user.id,
          name: user.name,
        })
        .from(user)
        .where(inArray(user.id, userIds)),
      db
        .select({
          userId: walletAddress.userId,
          address: walletAddress.address,
          isPrimary: walletAddress.isPrimary,
        })
        .from(walletAddress)
        .where(and(inArray(walletAddress.userId, userIds), eq(walletAddress.type, "svm"))),
    ]);

    const nameByUserId = new Map(userRows.map(row => [row.userId, row.name]));
    const walletsByUserId = new Map<string, Array<{ address: string; isPrimary: boolean }>>();

    for (const row of walletRows) {
      const current = walletsByUserId.get(row.userId) ?? [];
      current.push({ address: row.address, isPrimary: row.isPrimary });
      walletsByUserId.set(row.userId, current);
    }

    const displayNameByUserId = new Map<string, string>();
    for (const userId of userIds) {
      const walletCandidates = walletsByUserId.get(userId) ?? [];
      const primaryWallet = walletCandidates.find(wallet => wallet.isPrimary);
      const firstWallet =
        primaryWallet ??
        (walletCandidates.length > 0 ? walletCandidates.sort((a, b) => a.address.localeCompare(b.address))[0] : null);
      displayNameByUserId.set(
        userId,
        toDisplayName({
          name: nameByUserId.get(userId) ?? null,
          walletAddress: firstWallet ? firstWallet.address : null,
        }),
      );
    }

    return {
      total: totalRows.map<LeaderboardRecord>(row => ({
        userId: row.userId,
        displayName: displayNameByUserId.get(row.userId) ?? FALLBACK_DISPLAY_NAME,
        points: row.points,
      })),
      daily: dailyRows.map<LeaderboardRecord>(row => ({
        userId: row.userId,
        displayName: displayNameByUserId.get(row.userId) ?? FALLBACK_DISPLAY_NAME,
        points: row.points,
      })),
    };
  }
}
