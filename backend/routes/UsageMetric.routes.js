import express from 'express';
import * as usageMetricController from '../controllers/UsageMetric.controller.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { isAdminOrOwner } from '../middlewares/roleMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// GET usage metrics for a user
router.get('/user/:userId', isAdminOrOwner('userId'), asyncHandler(usageMetricController.getUserUsageMetrics));

// GET usage statistics (aggregated)
router.get('/user/:userId/statistics', isAdminOrOwner('userId'), asyncHandler(usageMetricController.getUsageStatistics));

// POST record usage
router.post('/', asyncHandler(usageMetricController.recordUsage));

// DELETE usage metrics
router.delete('/user/:userId', isAdminOrOwner('userId'), asyncHandler(usageMetricController.deleteUsageMetrics));

// POST check achievements (uses authenticated user)
router.post('/check-achievements', asyncHandler(usageMetricController.checkAchievements));

export default router;
