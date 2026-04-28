import { and, eq } from 'drizzle-orm';
import { db } from '#config/database.js';
import { organisations, orgMembers } from '#models/organisations.model.js';
import { users } from '#models/users.model.js';
import { ApiError } from '#utils/ApiError.js';
import logger from '#config/logger.js';

// ── Helpers ────────────────────────────────────────────────────────────────

// Slugify: "Acme Corp" → "acme-corp"
const toSlug = name =>
    name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// Assert the caller is an admin of the org — used before destructive actions.
export const assertOrgAdmin = async (orgId, userId) => {
    const [membership] = await db
        .select()
        .from(orgMembers)
        .where(and(eq(orgMembers.org_id, orgId), eq(orgMembers.user_id, userId)))
        .limit(1);

    if (!membership)      throw new ApiError(403, 'You are not a member of this organisation');
    if (membership.role !== 'admin') throw new ApiError(403, 'Only org admins can do this');
    return membership;
};

// ── CRUD ───────────────────────────────────────────────────────────────────

export const createOrganisation = async ({ name, userId }) => {
    const slug = toSlug(name);

    const [existing] = await db
        .select()
        .from(organisations)
        .where(eq(organisations.slug, slug))
        .limit(1);
    if (existing) throw new ApiError(409, 'An organisation with that name already exists');

    // Create org and add creator as admin in one go.
    const [org] = await db
        .insert(organisations)
        .values({ name, slug, created_by: userId })
        .returning();

    await db.insert(orgMembers).values({
        org_id:  org.id,
        user_id: userId,
        role:    'admin',   // creator is always the first admin
    });

    logger.info(`Organisation created: ${org.slug} by user ${userId}`);
    return org;
};

export const getOrganisationById = async (orgId) => {
    const [org] = await db
        .select()
        .from(organisations)
        .where(and(eq(organisations.id, orgId), eq(organisations.is_active, true)))
        .limit(1);

    if (!org) throw new ApiError(404, 'Organisation not found');
    return org;
};

// Returns all orgs the user belongs to.
export const getMyOrganisations = async (userId) => {
    const rows = await db
        .select({
            id:         organisations.id,
            name:       organisations.name,
            slug:       organisations.slug,
            role:       orgMembers.role,
            joined_at:  orgMembers.joined_at,
            created_at: organisations.created_at,
        })
        .from(orgMembers)
        .innerJoin(organisations, eq(orgMembers.org_id, organisations.id))
        .where(and(
            eq(orgMembers.user_id, userId),
            eq(organisations.is_active, true),
        ));

    return rows;
};

// ── Membership ─────────────────────────────────────────────────────────────

// Invite an existing user by email. Only org admins can do this.
export const inviteMember = async ({ orgId, inviterUserId, email, role = 'viewer' }) => {
    await assertOrgAdmin(orgId, inviterUserId);

    const [targetUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
    if (!targetUser) throw new ApiError(404, 'No user with that email address');

    const [alreadyMember] = await db
        .select()
        .from(orgMembers)
        .where(and(eq(orgMembers.org_id, orgId), eq(orgMembers.user_id, targetUser.id)))
        .limit(1);
    if (alreadyMember) throw new ApiError(409, 'User is already a member of this organisation');

    await db.insert(orgMembers).values({ org_id: orgId, user_id: targetUser.id, role });

    logger.info(`User ${targetUser.email} invited to org ${orgId} as ${role}`);
    return { userId: targetUser.id, email: targetUser.email, role };
};

// Change a member's role. Only org admins can do this.
export const updateMemberRole = async ({ orgId, adminUserId, targetUserId, newRole }) => {
    await assertOrgAdmin(orgId, adminUserId);

    // Prevent the last admin from being demoted.
    if (newRole !== 'admin') {
        const adminCount = await db
            .select()
            .from(orgMembers)
            .where(and(eq(orgMembers.org_id, orgId), eq(orgMembers.role, 'admin')));
        if (adminCount.length === 1 && adminCount[0].user_id === targetUserId) {
            throw new ApiError(400, 'Cannot demote the last admin of an organisation');
        }
    }

    const [updated] = await db
        .update(orgMembers)
        .set({ role: newRole })
        .where(and(eq(orgMembers.org_id, orgId), eq(orgMembers.user_id, targetUserId)))
        .returning();

    if (!updated) throw new ApiError(404, 'Member not found in this organisation');
    logger.info(`User ${targetUserId} role changed to ${newRole} in org ${orgId}`);
    return updated;
};

// Remove a member. Admins can remove anyone; members can remove themselves.
export const removeMember = async ({ orgId, requesterId, targetUserId }) => {
    const [requester] = await db
        .select()
        .from(orgMembers)
        .where(and(eq(orgMembers.org_id, orgId), eq(orgMembers.user_id, requesterId)))
        .limit(1);

    if (!requester) throw new ApiError(403, 'You are not a member of this organisation');

    // Non-admins can only remove themselves.
    if (requester.role !== 'admin' && requesterId !== targetUserId) {
        throw new ApiError(403, 'Only org admins can remove other members');
    }

    // Prevent removing the last admin.
    const adminRows = await db
        .select()
        .from(orgMembers)
        .where(and(eq(orgMembers.org_id, orgId), eq(orgMembers.role, 'admin')));
    const targetIsAdmin = adminRows.some(r => r.user_id === targetUserId);
    if (targetIsAdmin && adminRows.length === 1) {
        throw new ApiError(400, 'Cannot remove the last admin. Transfer ownership first.');
    }

    await db
        .delete(orgMembers)
        .where(and(eq(orgMembers.org_id, orgId), eq(orgMembers.user_id, targetUserId)));

    logger.info(`User ${targetUserId} removed from org ${orgId}`);
};

// List all members of an org (org members only).
export const listMembers = async ({ orgId, requesterId }) => {
    const [membership] = await db
        .select()
        .from(orgMembers)
        .where(and(eq(orgMembers.org_id, orgId), eq(orgMembers.user_id, requesterId)))
        .limit(1);
    if (!membership) throw new ApiError(403, 'You are not a member of this organisation');

    const rows = await db
        .select({
            userId:    users.id,
            name:      users.name,
            email:     users.email,
            role:      orgMembers.role,
            joinedAt:  orgMembers.joined_at,
            isActive:  users.is_active,
        })
        .from(orgMembers)
        .innerJoin(users, eq(orgMembers.user_id, users.id))
        .where(eq(orgMembers.org_id, orgId));

    return rows;
};
