import { sql } from "drizzle-orm";
import { check, index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { user } from "./auth";

export const userPointBalance = sqliteTable("user_point_balance", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  balance: integer("balance").notNull().default(0),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

export const pointTransaction = sqliteTable(
  "point_transaction",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    amount: integer("amount").notNull(),
    reason: text("reason").notNull(),
    idempotencyKey: text("idempotency_key"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  },
  table => [
    index("point_transaction_user_idx").on(table.userId),
    index("point_transaction_created_at_idx").on(table.createdAt),
    index("point_transaction_created_user_idx").on(table.createdAt, table.userId),
    uniqueIndex("point_transaction_idempotency_key_unique").on(table.idempotencyKey),
    check("point_transaction_amount_non_zero", sql`${table.amount} <> 0`),
  ],
);
