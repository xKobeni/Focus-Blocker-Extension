import express from 'express';
import * as scheduleController from '../controllers/Schedule.controller.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { isAdminOrOwner } from '../middlewares/roleMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// GET all schedules for a user
router.get('/user/:userId', isAdminOrOwner('userId'), asyncHandler(scheduleController.getUserSchedules));

// GET active schedules for a user
router.get('/user/:userId/active', isAdminOrOwner('userId'), asyncHandler(scheduleController.getActiveSchedules));

// GET a single schedule
router.get('/:id', asyncHandler(scheduleController.getScheduleById));

// POST create a new schedule
router.post('/', asyncHandler(scheduleController.createSchedule));

// PUT update a schedule
router.put('/:id', asyncHandler(scheduleController.updateSchedule));

// DELETE a schedule
router.delete('/:id', asyncHandler(scheduleController.deleteSchedule));

export default router;
