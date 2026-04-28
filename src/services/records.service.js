import { eq, and, gte, lte, desc, asc, sql } from 'drizzle-orm';
import { db } from '#config/database.js';
import { records } from '#models/records.model.js';
import { ApiError } from '#utils/ApiError.js';
import logger from '#config/logger.js';

const safeFields = {
    id:          records.id,
    amount:      records.amount,
    type:        records.type,
    category:    records.category,
    date:        records.date,
    description: records.description,
    created_by:  records.created_by,
    org_id:      records.org_id,
    created_at:  records.created_at,
    updated_at:  records.updated_at,
};

// When orgId is provided, scope to the whole org (all members' records).
// When only userId is provided, scope to that user's personal records.
const buildFilter = ({ userId, orgId, type, category, startDate, endDate }) => {
    const conditions = [eq(records.is_deleted, false)];

    if (orgId) {
        conditions.push(eq(records.org_id, orgId));
    } else {
        conditions.push(eq(records.created_by, userId));
    }

    if (type)      conditions.push(eq(records.type, type));
    if (category)  conditions.push(eq(records.category, category));
    if (startDate) conditions.push(gte(records.date, new Date(startDate)));
    if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        conditions.push(lte(records.date, end));
    }
    return and(...conditions);
};

export const getAllRecords = async ({ userId, orgId, type, category, startDate, endDate, page = 1, limit = 20, sortBy = 'date', order = 'desc' }) => {
    const where = buildFilter({ userId, orgId, type, category, startDate, endDate });
    const orderFn = order === 'asc' ? asc : desc;
    const col = sortBy === 'amount' ? records.amount : records.date;

    const rows = await db
        .select(safeFields)
        .from(records)
        .where(where)
        .orderBy(orderFn(col))
        .limit(limit)
        .offset((page - 1) * limit);

    const [{ count }] = await db
        .select({ count: sql`count(*)`.mapWith(Number) })
        .from(records)
        .where(where);

    return { data: rows, total: count, page, limit };
};

export const getRecordById = async (id, userId, orgId = null) => {
    const conditions = [
        eq(records.id, id),
        eq(records.is_deleted, false),
    ];
    // Org members can read any record in the org; solo users only their own.
    if (orgId) {
        conditions.push(eq(records.org_id, orgId));
    } else {
        conditions.push(eq(records.created_by, userId));
    }

    const [record] = await db
        .select(safeFields)
        .from(records)
        .where(and(...conditions))
        .limit(1);

    if (!record) throw new ApiError(404, 'Record not found');
    return record;
};

export const createRecord = async ({ amount, type, category, date, description, created_by, org_id = null }) => {
    const [record] = await db
        .insert(records)
        .values({
            amount:      String(amount),
            type,
            category,
            date:        date ? new Date(date) : new Date(),
            description,
            created_by,
            org_id,      // null for personal records
        })
        .returning(safeFields);

    logger.info(`Record created: id=${record.id} type=${type} amount=${amount} org=${org_id ?? 'personal'}`);
    return record;
};

export const updateRecord = async (id, userId, updates, orgId = null) => {
    await getRecordById(id, userId, orgId);

    const patch = {};
    if (updates.amount      !== undefined) patch.amount      = String(updates.amount);
    if (updates.type        !== undefined) patch.type        = updates.type;
    if (updates.category    !== undefined) patch.category    = updates.category;
    if (updates.date        !== undefined) patch.date        = new Date(updates.date);
    if (updates.description !== undefined) patch.description = updates.description;
    patch.updated_at = new Date();

    const whereConditions = [eq(records.id, id)];
    if (orgId) {
        whereConditions.push(eq(records.org_id, orgId));
    } else {
        whereConditions.push(eq(records.created_by, userId));
    }

    const [updated] = await db
        .update(records)
        .set(patch)
        .where(and(...whereConditions))
        .returning(safeFields);

    logger.info(`Record updated: id=${id}`);
    return updated;
};

export const softDeleteRecord = async (id, userId, orgId = null) => {
    await getRecordById(id, userId, orgId);

    const whereConditions = [eq(records.id, id)];
    if (orgId) {
        whereConditions.push(eq(records.org_id, orgId));
    } else {
        whereConditions.push(eq(records.created_by, userId));
    }

    await db
        .update(records)
        .set({ is_deleted: true, deleted_at: new Date(), updated_at: new Date() })
        .where(and(...whereConditions));

    logger.info(`Record soft-deleted: id=${id}`);
};
