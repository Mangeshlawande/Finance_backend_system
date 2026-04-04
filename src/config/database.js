import 'dotenv/config';
import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

const db = drizzle(pool);

export { db };
