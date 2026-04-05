import { z } from 'zod';

export const userIdSchema = z.object({
    id: z.string()
});

export const updateUserSchema = z.object({
    name: z.string().min(2).max(255).trim().optional(),
    email: z.string().email().max(255).toLowerCase().trim().optional(),
    role: z.enum(['admin', 'analyst', 'viewer']).optional(),
    is_active: z.boolean().optional(),
});
