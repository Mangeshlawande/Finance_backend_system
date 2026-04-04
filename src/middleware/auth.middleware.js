import logger from '#config/logger.js';
import { jwttoken } from '#utils/jwt.js';
import { ApiError } from '#utils/ApiError.js';

export const authenticateToken = (req, res, next) => {
    const token = req.cookies?.token;
    if (!token) return next(new ApiError(401, 'Authentication required: no token provided'));

    try {
        req.user = jwttoken.verify(token);
        logger.info(`Authenticated: ${req.user.email} [${req.user.role}]`);
        next();
    } catch {
        next(new ApiError(401, 'Authentication failed: invalid or expired token'));
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
