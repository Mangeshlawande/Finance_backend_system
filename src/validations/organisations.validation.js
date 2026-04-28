import { z } from 'zod';

export const createOrgSchema = z.object({
    name: z.string().min(2).max(255).trim(),
});

export const inviteMemberSchema = z.object({
    email: z.string().email().toLowerCase().trim(),
    role:  z.enum(['admin', 'analyst', 'viewer']).default('viewer'),
});

export const updateMemberRoleSchema = z.object({
    role: z.enum(['admin', 'analyst', 'viewer']),
});
