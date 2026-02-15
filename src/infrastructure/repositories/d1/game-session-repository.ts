import { GameSession } from "@/domain/entities/game-session";
import type { GameSessionStatus } from "@/domain/entities/game-session";
import type { GameSessionRepository } from "@/domain/repositories/game-session-repository";
import type { CharacterType } from "@/domain/values/character-type";
import { CHARACTER_TYPES } from "@/domain/values/character-type";
import { getDb } from "@/infrastructure/db/client";
import { gameSessions } from "@/infrastructure/db/schema";
import { user } from "@/infrastructure/db/schema/auth";
import { and, eq, gte, lt } from "drizzle-orm";

function isCharacterType(value: string): value is CharacterType {
  return (CHARACTER_TYPES as readonly string[]).includes(value);
}

function isGameSessionStatus(value: string): value is GameSessionStatus {
  return value === "active" || value === "completed" || value === "game_over";
}

function getUtcDayRange(): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
}

export class D1GameSessionRepository implements GameSessionRepository {
  async save(session: GameSession): Promise<void> {
    const db = await getDb();
    const now = new Date();
    await db.insert(gameSessions).values({
      id: session.id,
      userId: session.userId,
      characterType: session.characterType,
      status: session.status,
      messageCount: session.messageCount,
      createdAt: now,
      updatedAt: now,
    });
  }

  async findById(id: string): Promise<GameSession | undefined> {
    const db = await getDb();
    const rows = await db
      .select({
        id: gameSessions.id,
        userId: gameSessions.userId,
        characterType: gameSessions.characterType,
        status: gameSessions.status,
        messageCount: gameSessions.messageCount,
        createdAt: gameSessions.createdAt,
        username: user.name,
      })
      .from(gameSessions)
      .innerJoin(user, eq(user.id, gameSessions.userId))
      .where(eq(gameSessions.id, id))
      .limit(1);

    if (rows.length === 0) return undefined;
    return this.toDomain(rows[0]);
  }

  async findTodayByUserId(userId: string): Promise<GameSession[]> {
    const db = await getDb();
    const { start, end } = getUtcDayRange();
    const rows = await db
      .select({
        id: gameSessions.id,
        userId: gameSessions.userId,
        characterType: gameSessions.characterType,
        status: gameSessions.status,
        messageCount: gameSessions.messageCount,
        createdAt: gameSessions.createdAt,
        username: user.name,
      })
      .from(gameSessions)
      .innerJoin(user, eq(user.id, gameSessions.userId))
      .where(and(eq(gameSessions.userId, userId), gte(gameSessions.createdAt, start), lt(gameSessions.createdAt, end)));

    return rows.map(row => this.toDomain(row));
  }

  async updateStatus(id: string, status: GameSessionStatus, messageCount: number): Promise<void> {
    const db = await getDb();
    await db.update(gameSessions).set({ status, messageCount, updatedAt: new Date() }).where(eq(gameSessions.id, id));
  }

  async delete(id: string): Promise<void> {
    const db = await getDb();
    await db.delete(gameSessions).where(eq(gameSessions.id, id));
  }

  private toDomain(row: {
    id: string;
    userId: string;
    characterType: string;
    status: string;
    messageCount: number;
    createdAt: Date;
    username: string | null;
  }): GameSession {
    const characterType = isCharacterType(row.characterType) ? row.characterType : "tennen";
    const status = isGameSessionStatus(row.status) ? row.status : "active";
    return new GameSession(
      row.id,
      row.userId,
      row.username ?? "",
      characterType,
      [], // ngWords are loaded from cache separately
      status,
      row.messageCount,
      row.createdAt,
    );
  }
}
