import { relations } from "drizzle-orm";
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

// NOTE:
// - better-auth core and better-auth-web3 internally assume `user.email` exists.
// - With web3 `anonymous: true`, verify requests may omit email, but plugin still generates
//   a fallback email (emailDomainName ?? domain + ENS/SNS/short address) on user creation.
// - Do not remove `email` column unless auth plugin/runtime behavior is replaced accordingly.
export const user = sqliteTable(
  "user",
  {
    id: text("id").primaryKey(),
    name: text("name"),
    email: text("email"),
    emailVerified: integer("emailVerified", { mode: "boolean" }).notNull().default(false),
    image: text("image"),
    createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).notNull(),
  },
  table => [uniqueIndex("user_email_unique").on(table.email)],
);

export const session = sqliteTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: integer("expiresAt", { mode: "timestamp_ms" }).notNull(),
    token: text("token").notNull(),
    createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).notNull(),
    ipAddress: text("ipAddress"),
    userAgent: text("userAgent"),
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  table => [uniqueIndex("session_token_unique").on(table.token), index("session_user_id_idx").on(table.userId)],
);

export const account = sqliteTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("accountId").notNull(),
    providerId: text("providerId").notNull(),
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("accessToken"),
    refreshToken: text("refreshToken"),
    idToken: text("idToken"),
    accessTokenExpiresAt: integer("accessTokenExpiresAt", { mode: "timestamp_ms" }),
    refreshTokenExpiresAt: integer("refreshTokenExpiresAt", { mode: "timestamp_ms" }),
    scope: text("scope"),
    password: text("password"),
    createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).notNull(),
  },
  table => [
    uniqueIndex("account_provider_account_unique").on(table.providerId, table.accountId),
    index("account_user_id_idx").on(table.userId),
  ],
);

export const verification = sqliteTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: integer("expiresAt", { mode: "timestamp_ms" }).notNull(),
    createdAt: integer("createdAt", { mode: "timestamp_ms" }),
    updatedAt: integer("updatedAt", { mode: "timestamp_ms" }),
  },
  table => [index("verification_identifier_idx").on(table.identifier)],
);

// better-auth-web3 default schema
export const walletAddress = sqliteTable(
  "walletAddress",
  {
    id: text("id").primaryKey(),
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accountId: text("accountId")
      .notNull()
      .references(() => account.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    address: text("address").notNull(),
    chainId: integer("chainId"),
    isPrimary: integer("isPrimary", { mode: "boolean" }).notNull().default(false),
    createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull(),
  },
  table => [
    uniqueIndex("wallet_address_unique").on(table.address, table.type, table.chainId),
    index("wallet_address_user_id_idx").on(table.userId),
  ],
);

export const xAccount = sqliteTable(
  "xAccount",
  {
    id: text("id").primaryKey(),
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accountId: text("accountId")
      .notNull()
      .references(() => account.id, { onDelete: "cascade" }),
    providerAccountId: text("providerAccountId").notNull(),
    username: text("username"),
    linkedAt: integer("linkedAt", { mode: "timestamp_ms" }).notNull(),
    createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).notNull(),
  },
  table => [
    uniqueIndex("x_account_user_id_unique").on(table.userId),
    uniqueIndex("x_account_account_id_unique").on(table.accountId),
    index("x_account_provider_account_id_idx").on(table.providerAccountId),
  ],
);

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  walletAddresses: many(walletAddress),
  xAccounts: many(xAccount),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one, many }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
  walletAddresses: many(walletAddress),
  xAccounts: many(xAccount),
}));

export const walletAddressRelations = relations(walletAddress, ({ one }) => ({
  user: one(user, {
    fields: [walletAddress.userId],
    references: [user.id],
  }),
  account: one(account, {
    fields: [walletAddress.accountId],
    references: [account.id],
  }),
}));

export const xAccountRelations = relations(xAccount, ({ one }) => ({
  user: one(user, {
    fields: [xAccount.userId],
    references: [user.id],
  }),
  account: one(account, {
    fields: [xAccount.accountId],
    references: [account.id],
  }),
}));
