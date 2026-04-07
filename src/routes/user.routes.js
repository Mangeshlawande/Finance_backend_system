import { Router } from 'express';
import { fetchAllUsers, fetchUserById, updateUserById, deleteUserById } from '#controllers/users.controller.js';
import { authenticateToken, requireRole } from '#middleware/auth.middleware.js';

const router = Router();

router.use(authenticateToken); // all routes needs authentication

// Admin only: list all users, delete a user
router.get('/', requireRole('admin'), fetchAllUsers);//
router.delete('/user-id/:id', requireRole('admin'), deleteUserById);//

// Admin + self: get and update
router.get('/user-id/:id', fetchUserById);//
router.put('/user-id/:id', updateUserById);//

export default router;
