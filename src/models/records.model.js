import { pgTable, serial, timestamp, varchar, numeric, boolean, uuid } from 'drizzle-orm/pg-core';
import { organisations } from '#models/organisations.model.js';

export const records = pgTable('records', {
    id:          serial('id').primaryKey(),
    amount:      numeric('amount', { precision: 12, scale: 2 }).notNull(),
    type:        varchar('type', { length: 20 }).notNull(),       // income | expense
    category:    varchar('category', { length: 50 }).notNull().default('other'),
    date:        timestamp('date').notNull().defaultNow(),
    description: varchar('description', { length: 500 }),
    created_by:  uuid('created_by').notNull(),                    // FK → users.id
    org_id:      uuid('org_id').references(() => organisations.id, { onDelete: 'cascade' }), // nullable — personal records have no org
    is_deleted:  boolean('is_deleted').notNull().default(false),
    deleted_at:  timestamp('deleted_at'),
    created_at:  timestamp('created_at').defaultNow().notNull(),
    updated_at:  timestamp('updated_at').defaultNow().notNull(),
});
