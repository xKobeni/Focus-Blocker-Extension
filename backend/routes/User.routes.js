import express from 'express';
import * as userController from '../controllers/User.controller.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { isAdmin, isAdminOrOwner } from '../middlewares/roleMiddleware.js';

const router = express.Router();

// GET all users (admin only)
router.get('/', authenticate, isAdmin, asyncHandler(userController.getAllUsers));

// GET user by email (must be before /:id route)
router.get('/email/:email', authenticate, asyncHandler(userController.getUserByEmail));

// GET a single user by ID
router.get('/:id', authenticate, asyncHandler(userController.getUserById));

// POST create a new user (public - for registration, but can be protected)
router.post('/', asyncHandler(userController.createUser));

// PUT update a user (admin or owner)
router.put('/:id', authenticate, isAdminOrOwner('id'), asyncHandler(userController.updateUser));

// PATCH partially update a user (admin or owner)
router.patch('/:id', authenticate, isAdminOrOwner('id'), asyncHandler(userController.patchUser));

// DELETE a user (admin only)
router.delete('/:id', authenticate, isAdmin, asyncHandler(userController.deleteUser));

export default router;
