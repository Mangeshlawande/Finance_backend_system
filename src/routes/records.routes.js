import { Router } from 'express';
import { fetchAllRecords, fetchRecordById, createNewRecord, updateRecordById, deleteRecordById } from '#controllers/records.controller.js';
import { authenticateToken, requireRole } from '#middleware/auth.middleware.js';

const router = Router();

router.use(authenticateToken);

// Admin + analyst: read records
router.get('/get-records', requireRole('admin', 'analyst'), fetchAllRecords);//
router.get('/recordby-id/:id', requireRole('admin', 'analyst'), fetchRecordById); //

// Admin only: write records
router.post('/create-record', requireRole('admin'), createNewRecord);//
router.put('/update-record/:id', requireRole('admin'), updateRecordById); //
router.delete('/delete-record/:id', requireRole('admin'), deleteRecordById); // 

export default router;
