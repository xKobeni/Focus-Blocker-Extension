import User from '../models/User.model.js';
import UserSettings from '../models/UserSettings.model.js';
import FocusGoal from '../models/FocusGoal.model.js';
import bcrypt from 'bcryptjs';
import { generateToken } from '../utils/token.js';

// Register a new user
export const register = async (req, res) => {
    try {
        const { email, password, name, role } = req.body;

        // Validate required fields
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const user = new User({
            email,
            password: hashedPassword,
            name,
            role: role || 'user'
        });

        const savedUser = await user.save();
        
        // Create default UserSettings for new user
        const userSettings = new UserSettings({
            userId: savedUser._id,
            strictMode: false,
            allowOverrides: true,
            breakInterval: 25
        });
        await userSettings.save();

        // Create default FocusGoal for new user
        const focusGoal = new FocusGoal({
            userId: savedUser._id,
            dailyMinutes: 60,
            weeklyMinutes: 420, // 7 hours
            achieved: false
        });
        await focusGoal.save();

        const userResponse = savedUser.toObject();
        delete userResponse.password;

        // Generate JWT token
        const token = generateToken({
            userId: savedUser._id,
            email: savedUser.email
        });

        res.status(201).json({
            message: 'User registered successfully',
            user: userResponse,
            token
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Login user
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate required fields
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Check if user has a password (OAuth users might not have one)
        if (!user.password) {
            return res.status(401).json({ message: 'Please use OAuth to login' });
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Generate JWT token
        const token = generateToken({
            userId: user._id,
            email: user.email
        });

        const userResponse = user.toObject();
        delete userResponse.password;

        res.json({
            message: 'Login successful',
            user: userResponse,
            token
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get current user (protected route)
export const getCurrentUser = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const user = await User.findById(userId).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Verify token
export const verifyToken = async (req, res) => {
    try {
        const { verifyToken: verifyTokenUtil, extractTokenFromHeader } = await import('../utils/token.js');
        const token = extractTokenFromHeader(req.headers.authorization);
        
        if (!token) {
            return res.status(401).json({ message: 'No token provided' });
        }

        const decoded = verifyTokenUtil(token);
        const user = await User.findById(decoded.userId).select('-password');
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ valid: true, user });
    } catch (error) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Invalid or expired token' });
        }
        res.status(401).json({ message: 'Invalid or expired token' });
    }
};

// Google OAuth callback handler
export const googleCallback = async (req, res) => {
    try {
        const user = req.user; // User from passport

        if (!user) {
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
            return res.redirect(`${frontendUrl}/login?error=authentication_failed`);
        }

        // Generate JWT token
        const token = generateToken({
            userId: user._id,
            email: user.email
        });

        const userResponse = user.toObject();
        delete userResponse.password;

        // Check if request wants JSON response (for API clients)
        if (req.query.format === 'json') {
            return res.json({
                message: 'Google authentication successful',
                user: userResponse,
                token
            });
        }

        // Default: Redirect to frontend with token
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const redirectUrl = `${frontendUrl}/auth/callback?token=${token}&user=${encodeURIComponent(JSON.stringify(userResponse))}`;
        res.redirect(redirectUrl);
    } catch (error) {
        console.error('Google OAuth callback error:', error);
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        res.redirect(`${frontendUrl}/login?error=authentication_failed`);
    }
};
