import { getSummary, getCategoryBreakdown, getMonthlyTrends, getWeeklyTrends, getRecentActivity } from '#services/dashboard.service.js';
import { ApiResponse } from '#utils/ApiResponse.js';
import { asyncHandler } from '#utils/asyncHandler.js';

// req.orgId is set by requireOrgRole when the route is under an org context.
const scope = req => ({ userId: req.user.id, orgId: req.orgId ?? null });

export const fetchSummary = asyncHandler(async (req, res) => {
    const data = await getSummary({ ...scope(req), ...req.query });
    res.json(new ApiResponse(200, data, 'Summary retrieved'));
});

export const fetchCategoryBreakdown = asyncHandler(async (req, res) => {
    const breakdown = await getCategoryBreakdown({ ...scope(req), ...req.query });
    res.json(new ApiResponse(200, { breakdown }, 'Category breakdown retrieved'));
});

export const fetchMonthlyTrends = asyncHandler(async (req, res) => {
    const data = await getMonthlyTrends({
        ...scope(req),
        year: req.query.year ? +req.query.year : undefined,
    });
    res.json(new ApiResponse(200, data, 'Monthly trends retrieved'));
});

export const fetchWeeklyTrends = asyncHandler(async (req, res) => {
    const data = await getWeeklyTrends({
        ...scope(req),
        days: req.query.days ? +req.query.days : 7,
    });
    res.json(new ApiResponse(200, data, 'Trends retrieved'));
});

export const fetchRecentActivity = asyncHandler(async (req, res) => {
    const records = await getRecentActivity({
        ...scope(req),
        limit: req.query.limit ? +req.query.limit : 10,
    });
    res.json(new ApiResponse(200, { records }, 'Recent activity retrieved'));
});
