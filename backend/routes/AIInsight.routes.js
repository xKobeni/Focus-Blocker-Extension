import express from 'express';
import * as aiInsightController from '../controllers/AIInsight.controller.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { isAdminOrOwner } from '../middlewares/roleMiddleware.js';

const router = express.Router();

// GET latest AI insight for a user (must be before /user/:userId route)
router.get('/user/:userId/latest', authenticate, isAdminOrOwner('userId'), asyncHandler(aiInsightController.getLatestAIInsight));

// GET AI insights by user ID (must be before /:id route)
router.get('/user/:userId', authenticate, isAdminOrOwner('userId'), asyncHandler(aiInsightController.getAIInsightsByUserId));

// GET all AI insights (optionally filtered by userId)
router.get('/', authenticate, asyncHandler(aiInsightController.getAllAIInsights));

// GET a single AI insight by ID
router.get('/:id', authenticate, asyncHandler(aiInsightController.getAIInsightById));

// POST create a new AI insight
router.post('/', authenticate, asyncHandler(aiInsightController.createAIInsight));

// PUT update an AI insight
router.put('/:id', authenticate, asyncHandler(aiInsightController.updateAIInsight));

// PATCH partially update an AI insight
router.patch('/:id', authenticate, asyncHandler(aiInsightController.patchAIInsight));

// DELETE an AI insight
router.delete('/:id', authenticate, asyncHandler(aiInsightController.deleteAIInsight));

export default router;
