import {int, mysqlTable, timestamp, varchar} from 'drizzle-orm/mysql-core';
import {relations} from "drizzle-orm";

export const usersTable = mysqlTable("users", {
    id: int().autoincrement().primaryKey(),
    name: varchar({length: 255}).notNull(),
    email: varchar({length: 255}).notNull().unique(),
    password: varchar({length: 255}).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const short_link = mysqlTable('short_links_table', {
    id: int("serial_no").autoincrement().primaryKey(),
    url: varchar("url", { length: 255 }).notNull(),
    shortCode: varchar("short_code", { length: 20 }).notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
    userId: int("user_id")
        .notNull()
        .references(() => usersTable.id),
});

// A user can have many short links
export const usersRelation = relations(usersTable, ({ many }) => ({
    shortLink: many(short_link),
}));

// A short link belongs to a user
export const shortLinksRelation = relations(short_link, ({ one }) => ({
    user: one(usersTable, {
        fields: [short_link.userId], //foreign key
        references: [usersTable.id],
    }),
}));