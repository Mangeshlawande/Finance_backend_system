import { Router } from 'express';
import { fetchAllRecords, fetchRecordById, createNewRecord, updateRecordById, deleteRecordById } from '#controllers/records.controller.js';
import { authenticateToken, requireRole } from '#middleware/auth.middleware.js';

const router = Router();

router.use(authenticateToken);

// Admin + analyst: read records
router.get('/', requireRole('admin', 'analyst'), fetchAllRecords);
router.get('/:id', requireRole('admin', 'analyst'), fetchRecordById);

// Admin only: write records
router.post('/', requireRole('admin'), createNewRecord);
router.put('/:id', requireRole('admin'), updateRecordById);
router.delete('/:id', requireRole('admin'), deleteRecordById);

export default router;
