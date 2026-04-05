import 'dotenv/config';
import { db } from '../config/database.js';
import { users } from '../models/users.model.js';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';

async function seed() {

    try {
        const email = 'admin@finance.dev';
        const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);

        if (existing) {
            console.log('Seed admin already exists — skipping.');
            process.exit(0);
        }

        const password = await bcrypt.hash('Admin@123', 10);
        await db.insert(users).values({ name: 'System Admin', email, password, role: 'admin' });

        console.log('✅ Admin seeded → admin@finance.dev / Admin@123');
        process.exit(0);
        seed().catch(e => { console.error(e); process.exit(1); });

    } catch (error) {
        throw new ApiError(
            503,
            "Something went wrong while Creating Admin !!",
        );
    }
};