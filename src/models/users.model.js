import { pgTable, uuid, timestamp, varchar, boolean } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
    id: uuid('id').defaultRandom().primaryKey(), 
    name: varchar('name', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    password: varchar('password', { length: 255 }).notNull(),
    role: varchar('role', { length: 50 }).notNull().default('viewer'),
    is_active: boolean('is_active').notNull().default(true),
    created_at: timestamp('created_at').defaultNow().notNull(),
    updated_at: timestamp('updated_at').defaultNow().notNull(),
});


export const refreshTokens = pgTable('refresh_tokens', {
  id:         uuid('id').defaultRandom().primaryKey(),
  user_id:    uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token_hash: varchar('token_hash', { length: 255 }).notNull().unique(),
  expires_at: timestamp('expires_at').notNull(),
  revoked:    boolean('revoked').notNull().default(false),
  created_at: timestamp('created_at').defaultNow().notNull(),
});