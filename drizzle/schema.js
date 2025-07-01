import { int, mysqlTable, varchar } from 'drizzle-orm/mysql-core';

export const short_link = mysqlTable('short_links_table', {
    id: int("SERIAL NO.").autoincrement().primaryKey(),
    url: varchar("URL", { length: 255 }).notNull(),
    shortCode: varchar("SHORT_CODE", { length: 20 }).notNull().unique(),
});