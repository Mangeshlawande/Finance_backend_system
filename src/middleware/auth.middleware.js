import logger from '#config/logger.js';
import { jwttoken } from '#utils/jwt.js';
import { ApiError } from '#utils/ApiError.js';
import { db } from '#config/database.js';
import { orgMembers } from '#models/organisations.model.js';
import { and, eq } from 'drizzle-orm';

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

// Global role check (admin / analyst / viewer on the users table).
export const requireRole = (...roles) => (req, res, next) => {
    if (!req.user) return next(new ApiError(401, 'Authentication required'));
    if (!roles.includes(req.user.role)) {
        logger.warn(`Access denied: ${req.user.email} (${req.user.role}) needs [${roles.join(', ')}]`);
        return next(new ApiError(403, `Access denied: requires one of [${roles.join(', ')}]`));
    }
    next();
};

// Org-scoped role check.
// Reads the org_members table and attaches req.orgRole so downstream
// handlers know what the user can do inside this specific org.
// Usage: router.get('/:orgId/records', authenticateToken, requireOrgRole('admin','analyst'), handler)
export const requireOrgRole = (...roles) => async (req, res, next) => {
    try {
        const orgId = req.params.orgId || req.body.orgId;
        if (!orgId) return next(new ApiError(400, 'org_id is required'));

        const [membership] = await db
            .select()
            .from(orgMembers)
            .where(and(eq(orgMembers.org_id, orgId), eq(orgMembers.user_id, req.user.id)))
            .limit(1);

        if (!membership) return next(new ApiError(403, 'You are not a member of this organisation'));

        if (roles.length && !roles.includes(membership.role)) {
            logger.warn(`Org access denied: ${req.user.email} (${membership.role}) needs [${roles.join(', ')}] in org ${orgId}`);
            return next(new ApiError(403, `Requires org role: [${roles.join(', ')}]`));
        }

        req.orgRole = membership.role;  // available to all downstream handlers
        req.orgId   = orgId;
        next();
    } catch (err) {
        next(err);
    }
};
