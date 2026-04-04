import { db } from "#config/database.js";
import logger from "#config/logger.js";
import { users } from "#models/users.model.js";
import { ApiError } from "#utils/ApiError.js";
import { and, eq, ilike, or } from "drizzle-orm";


const safeFields = {
    id: users.id,
    name: users.name,
    email: users.email,
    role: users.role,
    is_active: users.is_active,
    created_at: users.created_at,
    updated_at: users.updated_at,
};

export const getAllUsers = async ({ role, is_active, search, page = 1, limit = 20 }) => {
    const conditions = [];

    if (role) conditions.push(eq(users.role, role));
    if (is_active !== undefined) conditions.push(eq(users.is_active, is_active));
    if (search) {
        conditions.push(or(
            ilike(users.name, `%${search}%`),
            ilike(users.email, `%${search}%`)
        ));
    }

    const where = conditions.length ? and(...conditions) : undefined;

    return db
        .select(safeFields)
        .from(users)
        .where(where)
        .limit(limit)
        .offset((page - 1) * limit)
        .orderBy(users.created_at);
};

export const getUserById = async id => {
    const [user] = await db.select(safeFields).from(users).where(eq(users.id, id)).limit(1);
    if (!user) throw new ApiError(404, 'User not found');
    return user;
};

export const updateUser = async (id, updates) => {
    await getUserById(id);

    if (updates.email) {
        const [clash] = await db.select().from(users).where(eq(users.email, updates.email)).limit(1);
        if (clash && clash.id !== id) throw new ApiError(409, 'Email already in use');
    }

    const [updated] = await db
        .update(users)
        .set({ ...updates, updated_at: new Date() })
        .where(eq(users.id, id))
        .returning(safeFields);

    logger.info(`User ${updated.email} updated`);
    return updated;
};

export const deleteUser = async id => {
    await getUserById(id);

    const [deleted] = await db
        .delete(users)
        .where(eq(users.id, id))
        .returning({ id: users.id, email: users.email });

    logger.info(`User ${deleted.email} deleted`);
    return deleted;
};

