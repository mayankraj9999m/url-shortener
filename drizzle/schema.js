import { boolean, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from 'drizzle-orm/mysql-core';
import { relations, sql } from "drizzle-orm";

export const usersTable = mysqlTable("users", {
    id: int().autoincrement().primaryKey(),
    name: varchar({ length: 255 }).notNull(),
    email: varchar({ length: 255 }).notNull().unique(),
    isEmailVerified: boolean('is_email_verified').default(false).notNull(),
    password: varchar({ length: 255 }),
    avatarUrl: text("avatar_url"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const verifyEmailTokensTable = mysqlTable('is_email_valid', {
    id: int().autoincrement().primaryKey(),
    userId: int("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    token: varchar({ length: 8 }).notNull(),
    expiresAt: timestamp("expires_at").default(sql`(CURRENT_TIMESTAMP + INTERVAL 1 DAY)`),
    createdAt: timestamp("created_at").defaultNow().notNull(),
})

export const sessionsTable = mysqlTable("sessions", {
    id: int().autoincrement().primaryKey(),
    userId: int('user_id').notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    valid: boolean().default(true).notNull(),
    userAgent: text("user_agent"),
    ip: varchar({ length: 255 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const short_link = mysqlTable('short_links_table', {
    id: int("serial_no").autoincrement().primaryKey(),
    url: varchar("url", { length: 255 }).notNull(),
    shortCode: varchar("short_code", { length: 20 }).notNull().unique(),
    clicks: int().default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
    userId: int("user_id")
        .notNull()
        .references(() => usersTable.id, { onDelete: "cascade" }),
});

export const passwordResetTokensTable = mysqlTable('password_reset_tokens', {
    id: int().autoincrement().primaryKey(),
    userId: int("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at").default(sql`(CURRENT_TIMESTAMP + INTERVAL 1 HOUR)`).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
})

//! OAuth Accounts Table
export const oauthAccountsTable = mysqlTable("oauth_accounts", {
    id: int("id").autoincrement().primaryKey(),
    userId: int("user_id")
        .references(() => usersTable.id, { onDelete: "cascade" }),
    provider: mysqlEnum("provider", ["google", "github"]).notNull(),
    providerAccountId: varchar("provider_account_id", { length: 255 })
        .notNull()
        .unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
})

//! Relations of foreign keys of tables
// A user can have many short links, sessions, tokens for email verification, and token hash for forgot password
export const usersRelation = relations(usersTable, ({ many }) => ({
    shortLink: many(short_link),
    session: many(sessionsTable),
    token: many(verifyEmailTokensTable),
    tokenHash: many(passwordResetTokensTable),
}));

// A short link belongs to a user
export const shortLinksRelation = relations(short_link, ({ one }) => ({
    user: one(usersTable, {
        fields: [short_link.userId], //foreign key
        references: [usersTable.id],
    }),
}));

// A session belongs to a user
export const sessionsRelation = relations(sessionsTable, ({ one }) => ({
    user: one(usersTable, {
        fields: [sessionsTable.userId], //foreign key
        references: [usersTable.id],
    }),
}));

// A token belongs to a user
export const emailVerifyTokenRelation = relations(verifyEmailTokensTable, ({ one }) => ({
    user: one(usersTable, {
        fields: [verifyEmailTokensTable.userId], //foreign key
        references: [usersTable.id],
    })
}))

// A token hash belongs to a user
export const passwordResetTokenHashRelation = relations(passwordResetTokensTable, ({ one }) => ({
    user: one(usersTable, {
        fields: [passwordResetTokensTable.userId], //foreign key
        references: [usersTable.id],
    })
}))

//! Practical use case
// The `relations()` functions from `drizzle-orm` are used to define relationships between database tables so that your ORM knows how entities are connected. This enables you to **easily query related data**, like retrieving a user’s short links or sessions without writing raw SQL.
//
//     Let’s go through **practical examples** of how you would use the defined relationships:
//
//     ---
//
//? ## ✅ Example 1: Get all short links and sessions for a user
//
//     ```ts
// import { db } from './db'; // your drizzle db instance
// import { usersTable, usersRelation } from './schema';
// import { eq } from 'drizzle-orm';
//
// const userId = 1;
//
// const userWithRelations = await db.query.usersTable.findFirst({
//   where: eq(usersTable.id, userId),
//   with: {
//     shortLink: true,
//     session: true,
//   },
// });
//
// console.log(userWithRelations);
// /*
// {
//   id: 1,
//   name: "John",
//   email: "john@example.com",
//   ...
//   shortLink: [
//     { id: 1, url: "https://example.com", shortCode: "abc123", ... },
//     { id: 2, url: "https://openai.com", shortCode: "xyz789", ... }
//   ],
//   session: [
//     { id: 1, userAgent: "Chrome", ip: "123.45.67.89", ... },
//     { id: 2, userAgent: "Firefox", ip: "123.45.67.90", ... }
//   ]
// }
// */
// ```
//
// ---
//
//? ## ✅ Example 2: Get the user who created a specific short link
//
//     ```ts
// import { short_link, shortLinksRelation } from './schema';
// import { eq } from 'drizzle-orm';
//
// const shortCode = 'abc123';
//
// const shortLinkWithUser = await db.query.short_link.findFirst({
//   where: eq(short_link.shortCode, shortCode),
//   with: {
//     user: true,
//   },
// });
//
// console.log(shortLinkWithUser);
// /*
// {
//   id: 1,
//   url: "https://example.com",
//   shortCode: "abc123",
//   ...
//   user: {
//     id: 1,
//     name: "John",
//     email: "john@example.com",
//     ...
//   }
// }
// */
// ```
//
// ---
//
//? ## ✅ Example 3: Get the user for a specific session
//
//     ```ts
// import { sessionsTable, sessionsRelation } from './schema';
// import { eq } from 'drizzle-orm';
//
// const sessionId = 1;
//
// const sessionWithUser = await db.query.sessionsTable.findFirst({
//   where: eq(sessionsTable.id, sessionId),
//   with: {
//     user: true,
//   },
// });
//
// console.log(sessionWithUser);
// /*
// {
//   id: 1,
//   userAgent: "Chrome",
//   ip: "123.45.67.89",
//   ...
//   user: {
//     id: 1,
//     name: "John",
//     email: "john@example.com",
//     ...
//   }
// }
// */
// ```
//
// ---
//
// ## Summary of Benefits:
//
//     Thanks to defining these relationships:
//
//     * You avoid manually joining tables.
// * The queries are readable and clean.
// * Type safety is preserved.
// * You can traverse relations in both directions.
//
//     Would you like to see how to insert data or update related records using these relations?