import { Router } from 'express';
import { fetchSummary, fetchCategoryBreakdown, fetchMonthlyTrends, fetchWeeklyTrends, fetchRecentActivity } from '#controllers/dashboard.controller.js';
import { authenticateToken } from '#middleware/auth.middleware.js';

const router = Router();

// All authenticated roles can view the dashboard
router.use(authenticateToken);

router.get('/summary', fetchSummary);//
router.get('/category-breakdown', fetchCategoryBreakdown);//
router.get('/monthly-trends', fetchMonthlyTrends);//
router.get('/weekly-trends', fetchWeeklyTrends);//
router.get('/recent-activity', fetchRecentActivity);//

export default router;
