import { sql } from "drizzle-orm";
import { check, index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { user } from "./auth";

export const messages = sqliteTable(
  "messages",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    sessionId: text("session_id").notNull(),
    role: text("role").notNull(),
    content: text("content").notNull(),
    point: integer("point"),
    emotion: text("emotion"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  },
  table => [
    index("messages_user_idx").on(table.userId),
    index("messages_session_idx").on(table.sessionId),
    index("messages_created_at_idx").on(table.createdAt),
    index("messages_user_session_created_idx").on(table.userId, table.sessionId, table.createdAt),
    check("messages_role_valid", sql`${table.role} in ('user', 'ai')`),
  ],
);
