import logger from "#config/logger.js";
import { createUser, authenticateUser, changeUserPassword } from "#services/auth.service.js";
import { ApiError } from "#utils/ApiError.js";
import { ApiResponse } from "#utils/ApiResponse.js";
import { asyncHandler } from "#utils/asyncHandler.js";
import { cookies } from "#utils/cookies.js";
import { formatValidationError } from "#utils/format.js"
import { jwttoken } from "#utils/jwt.js";
import { changePasswordSchema, signInSchema, signupSchema } from "#validations/auth.validation.js";


export const signup = asyncHandler(async (req, res) => {
    const result = signupSchema.safeParse(req.body);
    if (!result.success) throw new ApiError(400, 'Validation failed', formatValidationError(result.error));

    const { name, email, password, role } = result.data;
    const user = await createUser({ name, email, password, role });
    const token = jwttoken.sign({ id: user.id, email: user.email, role: user.role });

    cookies.set(res, 'token', token);
    logger.info(`signup: ${email}`);

    res.status(201).json(new ApiResponse(201, { user }, 'User registered successfully'));
});

export const signin = asyncHandler(async (req, res) => {
    const result = signInSchema.safeParse(req.body);
    if (!result.success) throw new ApiError(400, 'Validation failed', formatValidationError(result.error));

    const { email, password } = result.data;
    const user = await authenticateUser({ email, password });
    const token = jwttoken.sign({ id: user.id, email: user.email, role: user.role });

    cookies.set(res, 'token', token);
    logger.info(`signin: ${email}`);

    res.status(200).json(new ApiResponse(200, { user }, 'Signed in successfully'));
});

export const signout = (req, res) => {
    cookies.clear(res, 'token');
    res.status(200).json(new ApiResponse(200, {}, 'Signed out successfully'));
};

export const getMe = (req, res) => {
    res.status(200).json(new ApiResponse(200, { user: req.user }, 'Current user fetched'));
};


export const changePassword = asyncHandler(async (req, res) => {
    const result = changePasswordSchema.safeParse(req.body);
    if (!result.success) throw new ApiError(400, 'Validation failed', formatValidationError(result.error));

    await changeUserPassword(req.user.id, result.data.oldPassword, result.data.newPassword);
    res.status(200).json(new ApiResponse(200, {}, 'Password changed successfully'));
});
