import express from 'express';
import passport from '../config/passport.config.js';
import * as authController from '../controllers/Auth.controller.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { authRateLimit } from '../middlewares/rateLimitMiddleware.js';
import { authenticate } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Register a new user
router.post('/register', authRateLimit, asyncHandler(authController.register));

// Login user
router.post('/login', authRateLimit, asyncHandler(authController.login));

// Google OAuth routes (enable/disable with GOOGLE_OAUTH_ENABLED in .env)
const isGoogleOAuthEnabled = process.env.GOOGLE_OAUTH_ENABLED === 'true';
const hasGoogleCredentials = process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET;

if (isGoogleOAuthEnabled && hasGoogleCredentials) {
    router.get('/google', 
        authRateLimit,
        passport.authenticate('google', { scope: ['profile', 'email'] })
    );

    router.get('/google/callback',
        passport.authenticate('google', { session: false, failureRedirect: '/api/auth/google/failure' }),
        asyncHandler(authController.googleCallback)
    );

    router.get('/google/failure', (req, res) => {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        res.redirect(`${frontendUrl}/login?error=google_authentication_failed`);
    });
} else {
    // Google OAuth disabled - return helpful message
    const errorMessage = !isGoogleOAuthEnabled 
        ? 'Google OAuth is currently disabled. Set GOOGLE_OAUTH_ENABLED=true in .env to enable.'
        : 'Google OAuth is enabled but credentials are missing. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to your .env file';

    router.get('/google', (req, res) => {
        res.status(503).json({ 
            message: 'Google OAuth is unavailable',
            info: errorMessage
        });
    });

    router.get('/google/callback', (req, res) => {
        res.status(503).json({ 
            message: 'Google OAuth is unavailable',
            info: errorMessage
        });
    });
}

// Get current user (protected route - requires authentication middleware)
router.get('/me', authenticate, asyncHandler(authController.getCurrentUser));

// Verify token
router.get('/verify', asyncHandler(authController.verifyToken));

export default router;
