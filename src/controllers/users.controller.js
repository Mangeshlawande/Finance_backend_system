import logger from '#config/logger.js';
import { getAllUsers, getUserById, updateUser, deleteUser } from '#services/user.service.js';
import { formatValidationError } from '#utils/format.js';
import { ApiError } from '#utils/ApiError.js';
import { ApiResponse } from '#utils/ApiResponse.js';
import { asyncHandler } from '#utils/asyncHandler.js';
import { userIdSchema, updateUserSchema } from '#validations/users.validation.js';

export const fetchAllUsers = asyncHandler(async (req, res) => {

    try {
        const { role, search, page, limit } = req.query;
        const is_active = req.query.is_active !== undefined ? req.query.is_active === 'true' : undefined;
        const allUsers = await getAllUsers({ role, is_active, search, page: +page || 1, limit: +limit || 20 });
        res.json(new ApiResponse(200, { users: allUsers, count: allUsers.length }, 'Users retrieved'));

    } catch (error) {
        throw new ApiError(
            501,
            error || "Something went wrong while getting users !!",
        );
    }
});

export const fetchUserById = asyncHandler(async (req, res) => {
    const parsed = userIdSchema.safeParse({ id: req.params.id });
    if (!parsed.success) throw new ApiError(400, 'Validation failed', formatValidationError(parsed.error));

    try {
        const user = await getUserById(parsed.data.id);
        res.json(new ApiResponse(200, { user }, 'User retrieved'));

    } catch (error) {
        throw new ApiError(
            506,
            error || "Something went wrong while getting user !!",
        );
    }
});

export const updateUserById = asyncHandler(async (req, res) => {
    const idParsed = userIdSchema.safeParse({ id: req.params.id });
    if (!idParsed.success) throw new ApiError(400, 'Validation failed', formatValidationError(idParsed.error));

    const bodyParsed = updateUserSchema.safeParse(req.body);
    if (!bodyParsed.success) throw new ApiError(400, 'Validation failed', formatValidationError(bodyParsed.error));

    const { id } = idParsed.data;
    const updates = { ...bodyParsed.data };

    // Non-admins: only own profile, cannot touch role or is_active
    if (req.user.role !== 'admin') {
        if (req.user.id !== id) throw new ApiError(403, 'You can only update your own profile');
        delete updates.role;
        delete updates.is_active;
    }

    try {
        const user = await updateUser(id, updates);
        logger.info(`User ${id} updated by ${req.user.email}`);
        res.json(new ApiResponse(200, { user }, 'User updated'));

    } catch (error) {
        throw new ApiError(
            504,
            error || "Something went wrong while updating user !!",
        );
    }
});

export const deleteUserById = asyncHandler(async (req, res) => {
    const parsed = userIdSchema.safeParse({ id: req.params.id });
    if (!parsed.success) throw new ApiError(400, 'Validation failed', formatValidationError(parsed.error));

    const { id } = parsed.data;
    if (req.user.id === id) throw new ApiError(403, 'You cannot delete your own account');

    try {
        const user = await deleteUser(id);
        logger.info(`User ${id} deleted by ${req.user.email}`);
        res.json(new ApiResponse(200, { user }, 'User deleted'));

    } catch (error) {
        throw new ApiError(
            505,
            error || "Something went wrong while deleting user !!",
        );
    }
});
