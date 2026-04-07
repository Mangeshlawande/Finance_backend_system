import { getSummary, getCategoryBreakdown, getMonthlyTrends, getWeeklyTrends, getRecentActivity } from '#services/dashboard.service.js';
import { ApiResponse } from '#utils/ApiResponse.js';
import { asyncHandler } from '#utils/asyncHandler.js';

export const fetchSummary = asyncHandler(async (req, res) => {

  try {
    const data = await getSummary(req.query);
    res.json(new ApiResponse(200, data, 'Summary retrieved'));

  } catch (error) {
    throw new ApiError(
      504,
      error || "Internal server Error !",
    );
  }
});

export const fetchCategoryBreakdown = asyncHandler(async (req, res) => {
  try {

    const breakdown = await getCategoryBreakdown(req.query);
    res.json(new ApiResponse(200, { breakdown }, 'Category breakdown retrieved'));
  } catch (error) {
    throw new ApiError(
      502,
      error || "Something went wrong while getting category",
    );
  }
});

export const fetchMonthlyTrends = asyncHandler(async (req, res) => {
  try {

    const data = await getMonthlyTrends({ year: req.query.year ? +req.query.year : undefined });
    res.json(new ApiResponse(200, data, 'Monthly trends retrieved'));
  } catch (error) {
    throw new ApiError(
      503,
      error || "Something went while getting Monthly trends !",
    );
  }
});

export const fetchWeeklyTrends = asyncHandler(async (req, res) => {
  try {

    const data = await getWeeklyTrends({ days: req.query.days ? +req.query.days : 7 });
    res.json(new ApiResponse(200, data, 'Trends retrieved'));

  } catch (error) {
    throw new ApiError(
      500,
      error || "Interal Server Error !! ",
    );
  }
});

export const fetchRecentActivity = asyncHandler(async (req, res) => {
  try {

    const records = await getRecentActivity({ limit: req.query.limit ? +req.query.limit : 10 });
    res.json(new ApiResponse(200, { records }, 'Recent activity retrieved'));

  } catch (error) {
    throw new ApiError(
      505,
      error || "Something went wrong while getting Recent Activity ",
    );
  }
});
