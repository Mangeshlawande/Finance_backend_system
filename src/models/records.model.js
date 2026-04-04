import { pgTable, serial, timestamp, varchar, numeric, boolean, integer } from 'drizzle-orm/pg-core';

export const records = pgTable('records', {
    id: serial('id').primaryKey(),
    amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
    // income | expense
    type: varchar('type', { length: 20 }).notNull(),
    // salary | freelance | investment | rent | utilities | groceries
    // transport | healthcare | education | entertainment | other
    category: varchar('category', { length: 50 }).notNull().default('other'),
    date: timestamp('date').notNull().defaultNow(),
    description: varchar('description', { length: 500 }),
    created_by: integer('created_by').notNull(),   // FK → users.id
    is_deleted: boolean('is_deleted').notNull().default(false),
    deleted_at: timestamp('deleted_at'),
    created_at: timestamp('created_at').defaultNow().notNull(),
    updated_at: timestamp('updated_at').defaultNow().notNull(),
});
