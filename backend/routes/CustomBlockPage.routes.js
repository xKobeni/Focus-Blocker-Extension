import express from 'express';
import * as customBlockPageController from '../controllers/CustomBlockPage.controller.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { isAdminOrOwner } from '../middlewares/roleMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// GET custom block page for a user (use authenticated user's ID)
router.get('/me', asyncHandler(customBlockPageController.getCustomBlockPage));
router.get('/user/:userId', isAdminOrOwner('userId'), asyncHandler(customBlockPageController.getCustomBlockPage));

// PUT create or update custom block page
router.put('/user/:userId', isAdminOrOwner('userId'), asyncHandler(customBlockPageController.upsertCustomBlockPage));

// DELETE custom block page
router.delete('/user/:userId', isAdminOrOwner('userId'), asyncHandler(customBlockPageController.deleteCustomBlockPage));

export default router;
