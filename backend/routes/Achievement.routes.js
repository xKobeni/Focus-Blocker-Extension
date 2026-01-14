import express from 'express';
import * as achievementController from '../controllers/Achievement.controller.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { isAdminOrOwner } from '../middlewares/roleMiddleware.js';

const router = express.Router();

// GET achievements by user ID (must be before /:id route)
router.get('/user/:userId', authenticate, isAdminOrOwner('userId'), asyncHandler(achievementController.getAchievementsByUserId));

// GET all achievements (optionally filtered by userId)
router.get('/', authenticate, asyncHandler(achievementController.getAllAchievements));

// GET a single achievement by ID
router.get('/:id', authenticate, asyncHandler(achievementController.getAchievementById));

// POST create a new achievement
router.post('/', authenticate, asyncHandler(achievementController.createAchievement));

// PUT update an achievement
router.put('/:id', authenticate, asyncHandler(achievementController.updateAchievement));

// PATCH partially update an achievement
router.patch('/:id', authenticate, asyncHandler(achievementController.patchAchievement));

// DELETE an achievement
router.delete('/:id', authenticate, asyncHandler(achievementController.deleteAchievement));

export default router;
