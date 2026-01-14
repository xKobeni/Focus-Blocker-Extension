import express from 'express';
import * as focusGoalController from '../controllers/FocusGoal.controller.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { isAdminOrOwner } from '../middlewares/roleMiddleware.js';

const router = express.Router();

// GET focus goals by user ID (must be before /:id route)
router.get('/user/:userId', authenticate, isAdminOrOwner('userId'), asyncHandler(focusGoalController.getFocusGoalsByUserId));

// GET all focus goals (optionally filtered by userId)
router.get('/', authenticate, asyncHandler(focusGoalController.getAllFocusGoals));

// GET a single focus goal by ID
router.get('/:id', authenticate, asyncHandler(focusGoalController.getFocusGoalById));

// POST create a new focus goal
router.post('/', authenticate, asyncHandler(focusGoalController.createFocusGoal));

// PUT update a focus goal
router.put('/:id', authenticate, asyncHandler(focusGoalController.updateFocusGoal));

// PATCH partially update a focus goal
router.patch('/:id', authenticate, asyncHandler(focusGoalController.patchFocusGoal));

// DELETE a focus goal
router.delete('/:id', authenticate, asyncHandler(focusGoalController.deleteFocusGoal));

export default router;
