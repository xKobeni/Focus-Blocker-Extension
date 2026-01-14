import express from 'express';
import * as gifSearchController from '../controllers/GifSearch.controller.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { authenticate } from '../middlewares/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// GET search GIFs
router.get('/search', asyncHandler(gifSearchController.searchGifs));

// GET trending GIFs
router.get('/trending', asyncHandler(gifSearchController.getTrendingGifs));

export default router;
