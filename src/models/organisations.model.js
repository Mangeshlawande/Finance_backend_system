import { pgTable, uuid, timestamp, varchar, boolean } from 'drizzle-orm/pg-core';
import { users } from '#models/users.model.js';

// The top-level container — one org = one business / family / team.
export const organisations = pgTable('organisations', {
    id:         uuid('id').defaultRandom().primaryKey(),
    name:       varchar('name', { length: 255 }).notNull(),
    slug:       varchar('slug', { length: 100 }).notNull().unique(), // e.g. "acme-corp"
    created_by: uuid('created_by').notNull().references(() => users.id),
    is_active:  boolean('is_active').notNull().default(true),
    created_at: timestamp('created_at').defaultNow().notNull(),
    updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Join table — a user can belong to many orgs, an org has many users.
// The role here is the user's role WITHIN this org (admin / analyst / viewer).
export const orgMembers = pgTable('org_members', {
    id:      uuid('id').defaultRandom().primaryKey(),
    org_id:  uuid('org_id').notNull().references(() => organisations.id, { onDelete: 'cascade' }),
    user_id: uuid('user_id').notNull().references(() => users.id,         { onDelete: 'cascade' }),
    role:    varchar('role', { length: 50 }).notNull().default('viewer'), // admin | analyst | viewer
    joined_at: timestamp('joined_at').defaultNow().notNull(),
});
