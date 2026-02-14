import { sql } from "drizzle-orm";
import { check, index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { user } from "./auth";

export const gameSessions = sqliteTable(
  "game_sessions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    characterType: text("character_type").notNull(),
    status: text("status").notNull().default("active"),
    messageCount: integer("message_count").notNull().default(0),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  table => [
    index("game_sessions_user_idx").on(table.userId),
    index("game_sessions_user_created_idx").on(table.userId, table.createdAt),
    index("game_sessions_status_idx").on(table.status),
    check("game_sessions_status_valid", sql`${table.status} in ('active', 'completed', 'game_over')`),
  ],
);
