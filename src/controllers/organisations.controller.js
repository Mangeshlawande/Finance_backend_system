import { asyncHandler } from '#utils/asyncHandler.js';
import { ApiError } from '#utils/ApiError.js';
import { ApiResponse } from '#utils/ApiResponse.js';
import { formatValidationError } from '#utils/format.js';
import {
    createOrganisation, getOrganisationById, getMyOrganisations,
    inviteMember, updateMemberRole, removeMember, listMembers,
} from '#services/organisations.service.js';
import {
    createOrgSchema, inviteMemberSchema, updateMemberRoleSchema,
} from '#validations/organisations.validation.js';

export const createOrg = asyncHandler(async (req, res) => {
    const parsed = createOrgSchema.safeParse(req.body);
    if (!parsed.success) throw new ApiError(400, 'Validation failed', formatValidationError(parsed.error));

    const org = await createOrganisation({ name: parsed.data.name, userId: req.user.id });
    res.status(201).json(new ApiResponse(201, { org }, 'Organisation created'));
});

export const getMyOrgs = asyncHandler(async (req, res) => {
    const orgs = await getMyOrganisations(req.user.id);
    res.json(new ApiResponse(200, { orgs }, 'Organisations retrieved'));
});

export const getOrg = asyncHandler(async (req, res) => {
    const org = await getOrganisationById(req.params.orgId);
    res.json(new ApiResponse(200, { org }, 'Organisation retrieved'));
});

export const getMembers = asyncHandler(async (req, res) => {
    const members = await listMembers({ orgId: req.params.orgId, requesterId: req.user.id });
    res.json(new ApiResponse(200, { members }, 'Members retrieved'));
});

export const invite = asyncHandler(async (req, res) => {
    const parsed = inviteMemberSchema.safeParse(req.body);
    if (!parsed.success) throw new ApiError(400, 'Validation failed', formatValidationError(parsed.error));

    const member = await inviteMember({
        orgId:         req.params.orgId,
        inviterUserId: req.user.id,
        email:         parsed.data.email,
        role:          parsed.data.role,
    });
    res.status(201).json(new ApiResponse(201, { member }, 'Member invited'));
});

export const changeMemberRole = asyncHandler(async (req, res) => {
    const parsed = updateMemberRoleSchema.safeParse(req.body);
    if (!parsed.success) throw new ApiError(400, 'Validation failed', formatValidationError(parsed.error));

    const updated = await updateMemberRole({
        orgId:         req.params.orgId,
        adminUserId:   req.user.id,
        targetUserId:  req.params.userId,
        newRole:       parsed.data.role,
    });
    res.json(new ApiResponse(200, { updated }, 'Member role updated'));
});

export const leaveOrRemoveMember = asyncHandler(async (req, res) => {
    await removeMember({
        orgId:        req.params.orgId,
        requesterId:  req.user.id,
        targetUserId: req.params.userId,
    });
    res.json(new ApiResponse(200, {}, 'Member removed'));
});
