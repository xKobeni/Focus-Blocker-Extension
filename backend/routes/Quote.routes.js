import express from 'express';
import * as quoteController from '../controllers/Quote.controller.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { authenticate } from '../middlewares/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// GET random quote
router.get('/random', asyncHandler(quoteController.getRandomQuote));

// GET quote by category
router.get('/category', asyncHandler(quoteController.getQuoteByCategory));

export default router;
