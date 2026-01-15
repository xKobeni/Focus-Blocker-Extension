import express from 'express';
import {
    getActiveUnlocks,
    checkDomainUnlock,
    revokeUnlock,
    getUnlockHistory,
    getSessionUnlocks,
    cleanupExpiredUnlocks
} from '../controllers/TemporaryUnlock.controller.js';
import { authenticate } from '../middlewares/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get all active unlocks
router.get('/active', getActiveUnlocks);

// Check if specific domain is unlocked
router.get('/check/:domain', checkDomainUnlock);

// Get unlocks for current session
router.get('/session', getSessionUnlocks);

// Get unlock history
router.get('/history', getUnlockHistory);

// Revoke an unlock
router.delete('/:id', revokeUnlock);

// Cleanup expired unlocks (admin/cron)
router.post('/cleanup', cleanupExpiredUnlocks);

export default router;
