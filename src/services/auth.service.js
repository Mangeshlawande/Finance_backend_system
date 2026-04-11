import bcrypt from 'bcrypt'
import { and, eq, gt } from 'drizzle-orm'
import { db } from '#config/database.js'
import { refreshTokens, users } from '#models/users.model.js'
import { ApiError } from '#utils/ApiError.js'
import logger from '#config/logger.js'
import { generateRefreshToken, hashToken } from '#utils/jwt.js'
import { asyncHandler } from '#utils/asyncHandler.js'




export const createRefreshToken = async (userId) => {
    const { raw, expiresAt } = generateRefreshToken();
    await db.insert(refreshTokens).values({
        user_id: userId,
        token_hash: hashToken(raw),
        expires_at: expiresAt,
    });
    return raw; // only this raw value goes to the client
};



export const rotateRefreshToken = async (rawToken) => {
    const hash = hashToken(rawToken);

    // Find a valid, non-revoked, non-expired token
    const [existing] = await db
        .select()
        .from(refreshTokens)
        .where(
            and(
                eq(refreshTokens.token_hash, hash),
                eq(refreshTokens.revoked, false),
                gt(refreshTokens.expires_at, new Date()),
            )
        )
        .limit(1);

    if (!existing) throw new ApiError(401, 'Invalid or expired refresh token');

    // Revoke the old one (rotation — prevents replay)
    await db
        .update(refreshTokens)
        .set({ revoked: true })
        .where(eq(refreshTokens.id, existing.id));

    // Issue a fresh one
    const { raw, expiresAt } = generateRefreshToken();
    await db.insert(refreshTokens).values({
        user_id: existing.user_id,
        token_hash: hashToken(raw),
        expires_at: expiresAt,
    });

    return { userId: existing.user_id, newRawToken: raw };
};



export const revokeAllUserTokens = async (userId) => {
    await db
        .update(refreshTokens)
        .set({ revoked: true })
        .where(eq(refreshTokens.user_id, userId));
};

export const hashPassword = password => bcrypt.hash(password, 10);
export const comparePassword = (plain, hash) => bcrypt.compare(plain, hash);


export const createUser = async ({ name, email, password, role = 'viewer' }) => {

    try {
        const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
        if (existing) throw new ApiError(409, 'Email already registered');

        const hashed = await hashPassword(password);
        const [user] = await db
            .insert(users)
            .values({ name, email, password: hashed, role })
            .returning({ id: users.id, name: users.name, email: users.email, role: users.role });

        logger.info(`User created: ${user.email}`);
        return user;
    } catch (error) {
        throw new ApiError(
            502,
            "Something went wrong while creating user!!",
        );
    }
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

