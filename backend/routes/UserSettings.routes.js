import express from 'express';
import * as userSettingsController from '../controllers/UserSettings.controller.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { isAdminOrOwner } from '../middlewares/roleMiddleware.js';

const router = express.Router();

// GET user settings by user ID (must be before /:id route)
router.get('/user/:userId', authenticate, isAdminOrOwner('userId'), asyncHandler(userSettingsController.getUserSettingsByUserId));

// PUT or POST user settings by user ID (upsert) (must be before /:id route)
router.put('/user/:userId', authenticate, isAdminOrOwner('userId'), asyncHandler(userSettingsController.upsertUserSettingsByUserId));

// GET all user settings (optionally filtered by userId)
router.get('/', authenticate, asyncHandler(userSettingsController.getAllUserSettings));

// GET a single user setting by ID
router.get('/:id', authenticate, asyncHandler(userSettingsController.getUserSettingsById));

// POST create new user settings
router.post('/', authenticate, asyncHandler(userSettingsController.createUserSettings));

// PUT update user settings
router.put('/:id', authenticate, asyncHandler(userSettingsController.updateUserSettings));

// PATCH partially update user settings
router.patch('/:id', authenticate, asyncHandler(userSettingsController.patchUserSettings));

// DELETE user settings
router.delete('/:id', authenticate, asyncHandler(userSettingsController.deleteUserSettings));

export default router;
