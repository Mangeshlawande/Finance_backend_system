import { Router } from 'express';
import { signup, signin, signout, getMe, changePassword, refresh } from '#controllers/auth.controller.js';
import { authenticateToken } from '#middleware/auth.middleware.js';

const router = Router();

router.post('/sign-up',         signup);
router.post('/sign-in',         signin);
router.post('/sign-out',        authenticateToken, signout);  // needs user id to revoke tokens
router.post('/refresh',         refresh);
router.get('/me',               authenticateToken, getMe);
router.post('/change-password', authenticateToken, changePassword);

export default router;