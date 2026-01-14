import FocusSession from '../models/FocusSession.model.js';
import User from '../models/User.model.js';
import { calculateTotalSessionXP, calculateSessionXP } from '../utils/xpCalculator.js';
import { calculateLevel, getLevelInfo } from '../utils/levelCalculator.js';
import { calculateStreak, updateLongestStreak, shouldIncrementStreak } from '../utils/streakHelper.js';
import { isToday } from '../utils/dateUtils.js';

// Get all focus sessions
export const getAllFocusSessions = async (req, res) => {
    try {
        const { userId } = req.query;
        const query = userId ? { userId } : {};
        const focusSessions = await FocusSession.find(query)
            .populate('userId', 'name email')
            .sort({ createdAt: -1 });
        res.json(focusSessions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get a single focus session by ID
export const getFocusSessionById = async (req, res) => {
    try {
        const focusSession = await FocusSession.findById(req.params.id)
            .populate('userId', 'name email');
        if (!focusSession) {
            return res.status(404).json({ message: 'Focus session not found' });
        }
        res.json(focusSession);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get focus sessions by user ID
export const getFocusSessionsByUserId = async (req, res) => {
    try {
        const focusSessions = await FocusSession.find({ userId: req.params.userId })
            .sort({ createdAt: -1 });
        res.json(focusSessions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get active focus sessions for a user
export const getActiveFocusSessions = async (req, res) => {
    try {
        const activeSessions = await FocusSession.find({
            userId: req.params.userId,
            endTime: null
        });
        res.json(activeSessions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Create a new focus session
export const createFocusSession = async (req, res) => {
    try {
        const focusSession = new FocusSession({
            ...req.body,
            startTime: req.body.startTime || new Date()
        });
        const savedFocusSession = await focusSession.save();
        res.status(201).json(savedFocusSession);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Update a focus session
export const updateFocusSession = async (req, res) => {
    try {
        const focusSession = await FocusSession.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!focusSession) {
            return res.status(404).json({ message: 'Focus session not found' });
        }
        res.json(focusSession);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Partially update a focus session (e.g., end a session)
export const patchFocusSession = async (req, res) => {
    try {
        const focusSession = await FocusSession.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true, runValidators: true }
        );
        if (!focusSession) {
            return res.status(404).json({ message: 'Focus session not found' });
        }
        res.json(focusSession);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// End a focus session (calculate duration and update user stats)
export const endFocusSession = async (req, res) => {
    try {
        const focusSession = await FocusSession.findById(req.params.id);
        if (!focusSession) {
            return res.status(404).json({ message: 'Focus session not found' });
        }

        const endTime = new Date();
        const startTime = focusSession.startTime || new Date();
        const duration = Math.floor((endTime - startTime) / (1000 * 60)); // duration in minutes

        focusSession.endTime = endTime;
        focusSession.duration = duration;
        await focusSession.save();

        // Update user stats (XP, level, streak)
        if (focusSession.userId) {
            const user = await User.findById(focusSession.userId);
            if (user) {
                // Check if this is the first session today
                const isFirstSession = !user.lastFocusDate || !isToday(user.lastFocusDate);
                
                // Calculate XP
                const sessionXP = calculateSessionXP(duration, isFirstSession);
                
                // Update streak
                const newStreak = shouldIncrementStreak(user.lastFocusDate) 
                    ? calculateStreak(user.streak, user.lastFocusDate)
                    : user.streak;
                
                const streakBonus = newStreak > user.streak ? (newStreak - user.streak) * 5 : 0;
                const totalXP = sessionXP + streakBonus;
                
                // Update user
                user.xp = (user.xp || 0) + totalXP;
                user.level = calculateLevel(user.xp);
                user.streak = newStreak;
                user.longestStreak = updateLongestStreak(newStreak, user.longestStreak);
                user.lastFocusDate = new Date();
                
                await user.save();
            }
        }

        res.json(focusSession);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Delete a focus session
export const deleteFocusSession = async (req, res) => {
    try {
        const focusSession = await FocusSession.findByIdAndDelete(req.params.id);
        if (!focusSession) {
            return res.status(404).json({ message: 'Focus session not found' });
        }
        res.json({ message: 'Focus session deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
