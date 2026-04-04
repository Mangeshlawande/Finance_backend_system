import bcrypt from 'bcrypt'
import { eq } from 'drizzle-orm'
import { db } from '#config/database.js'
import { users } from '#models/users.model.js'
import { ApiError } from '#utils/ApiError.js'
import logger from '#config/logger.js'



export const hashPassword = password => bcrypt.hash(password, 10);
export const comparePassword = (plain, hash) => bcrypt.compare(plain, hash);


export const createUser = async ({ name, email, password, role = 'viewer' }) => {
    const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existing) throw new ApiError(409, 'Email already registered');

    const hashed = await hashPassword(password);
    const [user] = await db
        .insert(users)
        .values({ name, email, password: hashed, role })
        .returning({ id: users.id, name: users.name, email: users.email, role: users.role });

    logger.info(`User created: ${user.email}`);
    return user;
};


export const authenticateUser = async ({ email, password }) => {
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!user) throw new ApiError(404, 'User not found');
    if (!user.is_active) throw new ApiError(403, 'Account is deactivated');

    const valid = await comparePassword(password, user.password);
    if (!valid) throw new ApiError(401, 'Invalid credentials');

    const { password: _, ...safe } = user;
    logger.info(`User authenticated: ${user.email}`);
    return safe;
};



export const changeUserPassword = async (userId, oldPassword, newPassword) => {
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) throw new ApiError(404, 'User not found');

    const valid = await comparePassword(oldPassword, user.password);
    if (!valid) throw new ApiError(400, 'Old password is incorrect');

    const hashed = await hashPassword(newPassword);
    await db.update(users).set({ password: hashed, updated_at: new Date() }).where(eq(users.id, userId));
    logger.info(`Password changed for user ${userId}`);
};

