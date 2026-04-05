import { z } from 'zod';

const TYPES = ['income', 'expense'];
const CATEGORIES = [
    'salary', 'freelance', 'investment', 'rent', 'utilities',
    'groceries', 'transport', 'healthcare', 'education', 'entertainment', 'other',
];

export const createRecordSchema = z.object({
    amount: z.number({ coerce: true }).positive('Amount must be positive'),
    type: z.enum(TYPES),
    category: z.enum(CATEGORIES).default('other'),
    date: z.string().datetime({ offset: true }).optional(),
    description: z.string().max(500).trim().optional(),
});

export const updateRecordSchema = z.object({
    amount: z.number({ coerce: true }).positive().optional(),
    type: z.enum(TYPES).optional(),
    category: z.enum(CATEGORIES).optional(),
    date: z.string().datetime({ offset: true }).optional(),
    description: z.string().max(500).trim().optional(),
});

export const recordQuerySchema = z.object({
    type: z.enum(TYPES).optional(),
    category: z.enum(CATEGORIES).optional(),
    startDate: z.string().datetime({ offset: true }).optional(),
    endDate: z.string().datetime({ offset: true }).optional(),
    page: z.string().regex(/^\d+$/).transform(Number).default('1'),
    limit: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().max(100)).default('20'),
    sortBy: z.enum(['date', 'amount']).default('date'),
    order: z.enum(['asc', 'desc']).default('desc'),
});

export const recordIdSchema = z.object({
    id: z.string(),
        
});
