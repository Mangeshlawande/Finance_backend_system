import logger from '#config/logger.js';
import { jwttoken } from '#utils/jwt.js';
import { ApiError } from '#utils/ApiError.js';

export const authenticateToken = (req, res, next) => {
    const token = req.cookies?.access_token;
    if (!token) return next(new ApiError(401, 'Authentication required'));
    try {
        req.user = jwttoken.verify(token);
        next();
    } catch {
        next(new ApiError(401, 'Invalid or expired access token'));
    }
};

export const requireRole = (...roles) => (req, res, next) => {
    if (!req.user) return next(new ApiError(401, 'Authentication required'));
    if (!roles.includes(req.user.role)) {
        logger.warn(`Access denied: ${req.user.email} (${req.user.role}) needs [${roles.join(', ')}]`);
        return next(new ApiError(403, `Access denied: requires one of [${roles.join(', ')}]`));
    }
    next();
};
