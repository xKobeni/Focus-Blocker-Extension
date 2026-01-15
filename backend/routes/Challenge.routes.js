import express from 'express';
import {
    generateNewChallenge,
    verifyChallenge,
    getUserChallenges,
    getChallengeStats
} from '../controllers/Challenge.controller.js';
import { authenticate } from '../middlewares/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Generate a new challenge
router.post('/generate', generateNewChallenge);

// Verify challenge completion
router.post('/:id/verify', verifyChallenge);

// Get user's challenge history
router.get('/user/:userId', getUserChallenges);

// Get challenge statistics
router.get('/stats', getChallengeStats);

export default router;
