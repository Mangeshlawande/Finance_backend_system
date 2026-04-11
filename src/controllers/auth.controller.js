import { db } from "#config/database.js";
import logger from "#config/logger.js";
import { users } from "#models/users.model.js";
import { createUser, authenticateUser, changeUserPassword, createRefreshToken, rotateRefreshToken, revokeAllUserTokens } from "#services/auth.service.js";
import { ApiError } from "#utils/ApiError.js";
import { ApiResponse } from "#utils/ApiResponse.js";
import { asyncHandler } from "#utils/asyncHandler.js";
import { cookies } from "#utils/cookies.js";
import { formatValidationError } from "#utils/format.js"
import { jwttoken } from "#utils/jwt.js";
import { changePasswordSchema, signInSchema, signupSchema } from "#validations/auth.validation.js";
import { eq } from "drizzle-orm";



// New refresh endpoint
export const refresh = asyncHandler(async (req, res) => {
    const rawToken = req.cookies?.refresh_token;
    if (!rawToken) throw new ApiError(401, 'No refresh token provided');

    const { userId, newRawToken } = await rotateRefreshToken(rawToken);

    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user || !user.is_active) throw new ApiError(403, 'Account inactive');

    const accessToken = jwttoken.sign({ id: user.id, email: user.email, role: user.role });
    cookies.set(res, accessToken, newRawToken);

    res.status(200).json(new ApiResponse(200, {}, 'Token refreshed'));
});





export const signup = asyncHandler(async (req, res) => {

    const result = signupSchema.safeParse(req.body);
    if (!result.success) throw new ApiError(400, 'Validation failed', formatValidationError(result.error));
    try {

        const { name, email, password, role } = result.data;
        const user = await createUser({ name, email, password, role });

        const accessToken = jwttoken.sign({ id: user.id, email: user.email, role: user.role });
        const refreshToken = await createRefreshToken(user.id);
        cookies.set(res, accessToken, refreshToken);

        logger.info(`signup: ${email}`);

        return res.status(201)
            .json(new ApiResponse(201, { user }, 'User registered successfully'));

    } catch (error) {
        throw new ApiError(
            500,
            error,
        );
    }
});

export const signin = asyncHandler(async (req, res) => {
    const result = signInSchema.safeParse(req.body);
    if (!result.success) throw new ApiError(400, 'Validation failed', formatValidationError(result.error));
    try {
        const { email, password } = result.data;
        const user = await authenticateUser({ email, password });

        const accessToken = jwttoken.sign({ id: user.id, email: user.email, role: user.role });
        const refreshToken = await createRefreshToken(user.id);
        cookies.set(res, accessToken, refreshToken);

        logger.info(`signin: ${email}`);

        return res
            .status(200)
            .json(new ApiResponse(200, { user }, 'Signed in successfully'));

    } catch (error) {
        throw new ApiError(
            501,
            error || "Something went wrong ",
        );
    }
});



// Signout — revoke all refresh tokens for this user
export const signout = asyncHandler(async (req, res) => {
    if (req.user?.id) await revokeAllUserTokens(req.user.id);
    cookies.clear(res);
    res.status(200).json(new ApiResponse(200, {}, 'Signed out successfully'));
});


export const getMe = (req, res) => {
    return res.status(200).json(new ApiResponse(200, { user: req.user }, 'Current user fetched'));
};


export const changePassword = asyncHandler(async (req, res) => {
    try {

        const result = changePasswordSchema.safeParse(req.body);
        if (!result.success) throw new ApiError(400, 'Validation failed', formatValidationError(result.error));

        await changeUserPassword(req.user.id, result.data.oldPassword, result.data.newPassword);
        return res
            .status(200)
            .json(new ApiResponse(200, {}, 'Password changed successfully'));

    } catch (error) {
        throw new ApiError(
            502,
            error || "Something went wrong while changing password !",
        );
    }
});


