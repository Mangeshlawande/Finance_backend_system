import { and, eq, gte, lte, sql } from 'drizzle-orm';
import { db } from '#config/database.js';
import { records } from '#models/records.model.js';

 
const activeRecords = (userId, extra = []) =>
    and(
        eq(records.is_deleted, false),
        eq(records.created_by, userId),   // every query scoped to this user
        ...extra,
    );

const dateRange = (startDate, endDate) => {
    const conds = [];
    if (startDate) conds.push(gte(records.date, new Date(startDate)));
    if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        conds.push(lte(records.date, end));
    }
    return conds;
};

// ── Summary: totals + net balance ─────────────────────────────────────────
export const getSummary = async ({ userId, startDate, endDate } = {}) => {
    const rows = await db
        .select({
            type: records.type,
            total: sql`sum(${records.amount}::numeric)`.mapWith(Number),
            count: sql`count(*)`.mapWith(Number),
        })
        .from(records)
        .where(activeRecords(userId, dateRange(startDate, endDate)))
        .groupBy(records.type);
 
    const summary = { totalIncome: 0, totalExpenses: 0, netBalance: 0, recordCount: 0 };
    for (const r of rows) {
        if (r.type === 'income') { summary.totalIncome = r.total; summary.recordCount += r.count; }
        if (r.type === 'expense') { summary.totalExpenses = r.total; summary.recordCount += r.count; }
    }
    summary.netBalance = summary.totalIncome - summary.totalExpenses;
    return summary;
};


// ── Category breakdown ─────────────────────────────────────────────────────
export const getCategoryBreakdown = async ({ userId, startDate, endDate, type } = {}) => {
    const extra = dateRange(startDate, endDate);
    if (type) extra.push(eq(records.type, type));
 
    const rows = await db
        .select({
            category: records.category,
            type: records.type,
            total: sql`sum(${records.amount}::numeric)`.mapWith(Number),
            count: sql`count(*)`.mapWith(Number),
        })
        .from(records)
        .where(activeRecords(userId, extra))
        .groupBy(records.category, records.type)
        .orderBy(sql`sum(${records.amount}::numeric) desc`);
 
    return rows;
};

// ── Monthly trends (12 months for a given year) ───────────────────────────
export const getMonthlyTrends = async ({ userId, year } = {}) => {
    const y = year || new Date().getFullYear();
 
    const rows = await db
        .select({
            month: sql`extract(month from ${records.date})`.mapWith(Number),
            type: records.type,
            total: sql`sum(${records.amount}::numeric)`.mapWith(Number),
        })
        .from(records)
        .where(
            activeRecords(userId, [
                gte(records.date, new Date(`${y}-01-01`)),
                lte(records.date, new Date(`${y}-12-31T23:59:59.999Z`)),
            ])
        )
        .groupBy(sql`extract(month from ${records.date})`, records.type)
        .orderBy(sql`extract(month from ${records.date})`);
 
    const months = Array.from({ length: 12 }, (_, i) => ({ month: i + 1, income: 0, expense: 0 }));
    for (const r of rows) {
        months[r.month - 1][r.type] = r.total;
    }
    return { year: y, trends: months };
};

// ── Daily trends for the last N days ─────────────────────────────────────
export const getWeeklyTrends = async ({ userId, days = 7 } = {}) => {
    const n = Math.min(30, days);
    const since = new Date();
    since.setDate(since.getDate() - n);
    since.setHours(0, 0, 0, 0);
 
    const rows = await db
        .select({
            day: sql`to_char(${records.date}, 'YYYY-MM-DD')`,
            type: records.type,
            total: sql`sum(${records.amount}::numeric)`.mapWith(Number),
            count: sql`count(*)`.mapWith(Number),
        })
        .from(records)
        .where(activeRecords(userId, [gte(records.date, since)]))
        .groupBy(sql`to_char(${records.date}, 'YYYY-MM-DD')`, records.type)
        .orderBy(sql`to_char(${records.date}, 'YYYY-MM-DD')`);
 
    return { days: n, trends: rows };
};
 
// ── Recent activity ───────────────────────────────────────────────────────
export const getRecentActivity = async ({ userId, limit = 10 } = {}) => {
    const n = Math.min(50, limit);
    const rows = await db
        .select({
            id: records.id,
            amount: records.amount,
            type: records.type,
            category: records.category,
            date: records.date,
            description: records.description,
            created_at: records.created_at,
        })
        .from(records)
        .where(activeRecords(userId))
        .orderBy(sql`${records.date} desc`)
        .limit(n);
 
    return rows;
};