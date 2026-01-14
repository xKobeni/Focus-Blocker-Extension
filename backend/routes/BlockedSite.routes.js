import express from 'express';
import * as blockedSiteController from '../controllers/BlockedSite.controller.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { isAdminOrOwner } from '../middlewares/roleMiddleware.js';

const router = express.Router();

// GET blocked sites by user ID (must be before /:id route)
router.get('/user/:userId', authenticate, isAdminOrOwner('userId'), asyncHandler(blockedSiteController.getBlockedSitesByUserId));

// GET all blocked sites (optionally filtered by userId)
router.get('/', authenticate, asyncHandler(blockedSiteController.getAllBlockedSites));

// GET a single blocked site by ID
router.get('/:id', authenticate, asyncHandler(blockedSiteController.getBlockedSiteById));

// POST create a new blocked site
router.post('/', authenticate, asyncHandler(blockedSiteController.createBlockedSite));

// PUT update a blocked site
router.put('/:id', authenticate, asyncHandler(blockedSiteController.updateBlockedSite));

// PATCH partially update a blocked site
router.patch('/:id', authenticate, asyncHandler(blockedSiteController.patchBlockedSite));

// DELETE a blocked site
router.delete('/:id', authenticate, asyncHandler(blockedSiteController.deleteBlockedSite));

export default router;
