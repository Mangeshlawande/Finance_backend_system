import { Router } from 'express';
import { fetchAllUsers, fetchUserById, updateUserById, deleteUserById } from '#controllers/users.controller.js';
import { authenticateToken, requireRole } from '#middleware/auth.middleware.js';

const router = Router();

router.use(authenticateToken); // all routes needs authentication

// Admin only: list all users, delete a user
router.get('/', requireRole('admin'), fetchAllUsers);
router.delete('/:id', requireRole('admin'), deleteUserById);

// Admin + self: get and update
router.get('/:id', fetchUserById);
router.put('/:id', updateUserById);

export default router;
