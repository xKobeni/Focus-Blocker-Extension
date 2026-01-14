import express from 'express';
import * as timeLimitController from '../controllers/TimeLimit.controller.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { isAdminOrOwner } from '../middlewares/roleMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// GET time limits for a user
router.get('/user/:userId', isAdminOrOwner('userId'), asyncHandler(timeLimitController.getUserTimeLimits));

// GET a single time limit
router.get('/:id', asyncHandler(timeLimitController.getTimeLimitById));

// POST create a new time limit
router.post('/', asyncHandler(timeLimitController.createTimeLimit));

// PUT update a time limit
router.put('/:id', asyncHandler(timeLimitController.updateTimeLimit));

// PATCH update time used
router.patch('/:id/time-used', asyncHandler(timeLimitController.updateTimeUsed));

// DELETE a time limit
router.delete('/:id', asyncHandler(timeLimitController.deleteTimeLimit));

// POST reset all time limits for a user
router.post('/user/:userId/reset', isAdminOrOwner('userId'), asyncHandler(timeLimitController.resetTimeLimits));

export default router;
