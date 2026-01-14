import express from 'express';
import * as focusSessionController from '../controllers/FocusSession.controller.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { isAdminOrOwner } from '../middlewares/roleMiddleware.js';

const router = express.Router();

// GET active focus sessions for a user (must be before /user/:userId route)
router.get('/user/:userId/active', authenticate, isAdminOrOwner('userId'), asyncHandler(focusSessionController.getActiveFocusSessions));

// GET focus sessions by user ID (must be before /:id route)
router.get('/user/:userId', authenticate, isAdminOrOwner('userId'), asyncHandler(focusSessionController.getFocusSessionsByUserId));

// GET all focus sessions (optionally filtered by userId) - authenticated users only
router.get('/', authenticate, asyncHandler(focusSessionController.getAllFocusSessions));

// GET a single focus session by ID
router.get('/:id', authenticate, asyncHandler(focusSessionController.getFocusSessionById));

// POST create a new focus session
router.post('/', authenticate, asyncHandler(focusSessionController.createFocusSession));

// PUT update a focus session
router.put('/:id', authenticate, asyncHandler(focusSessionController.updateFocusSession));

// PATCH partially update a focus session
router.patch('/:id', authenticate, asyncHandler(focusSessionController.patchFocusSession));

// POST end a focus session (calculate duration and update stats)
router.post('/:id/end', authenticate, asyncHandler(focusSessionController.endFocusSession));

// DELETE a focus session
router.delete('/:id', authenticate, asyncHandler(focusSessionController.deleteFocusSession));

export default router;
