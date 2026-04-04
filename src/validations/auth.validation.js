import { z } from "zod";


export const signupSchema = z.object({
    name: z.string().min(2).max(255).trim(),
    email: z.string().email().max(255).toLowerCase().trim(),
    password: z.string().min(6).max(100),
    // default role on registration is viewer; admin assigns analyst/admin later
    role: z.enum(['admin', 'analyst', 'viewer']).default('viewer'),
});

export const signInSchema = z.object({
    email: z.string().email().toLowerCase().trim(),
    password: z.string().min(1),
});

export const changePasswordSchema = z.object({
    oldPassword: z.string().min(1),
    newPassword: z.string().min(6).max(100),
});
