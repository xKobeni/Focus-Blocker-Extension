import Challenge from '../models/Challenge.model.js';
import TemporaryUnlock from '../models/TemporaryUnlock.model.js';
import User from '../models/User.model.js';
import UserSettings from '../models/UserSettings.model.js';
import FocusSession from '../models/FocusSession.model.js';
import { generateChallenge, verifyChallengeAnswer, XP_REWARDS } from '../utils/challengeGenerator.js';
import { calculateLevel } from '../utils/levelCalculator.js';

// Generate a new challenge
export const generateNewChallenge = async (req, res) => {
    try {
        const { userId, type, domain } = req.body;
        
        if (!userId) {
            return res.status(400).json({ message: 'User ID is required' });
        }
        
        // Get user settings to determine difficulty and allowed types
        let settings = await UserSettings.findOne({ userId });
        if (!settings) {
            settings = {
                challengeSettings: {
                    difficulty: 2,
                    allowedTypes: ['math', 'memory', 'typing']
                }
            };
        }
        
        // Check if challenges are enabled
        if (!settings.challengeSettings.enabled) {
            return res.status(403).json({ message: 'Challenges are not enabled for this user' });
        }
        
        // Determine challenge type
        let challengeType = type;
        if (!challengeType) {
            // Random type from allowed types
            const allowedTypes = settings.challengeSettings.allowedTypes;
            challengeType = allowedTypes[Math.floor(Math.random() * allowedTypes.length)];
        }
        
        // Check if type is allowed
        if (!settings.challengeSettings.allowedTypes.includes(challengeType)) {
            return res.status(400).json({ message: 'This challenge type is not allowed in your settings' });
        }
        
        // Get difficulty from settings
        const difficulty = settings.challengeSettings.difficulty || 2;
        
        // Check cooldown - ensure user isn't spamming challenges
        const cooldownMinutes = settings.challengeSettings.cooldownMinutes || 5;
        const lastChallenge = await Challenge.findOne({ userId })
            .sort({ createdAt: -1 })
            .limit(1);
        
        if (lastChallenge && !lastChallenge.success) {
            const timeSinceLastChallenge = (Date.now() - lastChallenge.createdAt) / 1000 / 60; // minutes
            if (timeSinceLastChallenge < cooldownMinutes) {
                const remainingTime = Math.ceil(cooldownMinutes - timeSinceLastChallenge);
                return res.status(429).json({ 
                    message: `Please wait ${remainingTime} more minute(s) before trying another challenge`,
                    remainingTime
                });
            }
        }
        
        // Check if user has active session
        const activeSession = await FocusSession.findOne({
            userId,
            endTime: null
        });
        
        if (!activeSession) {
            return res.status(400).json({ message: 'No active focus session found' });
        }
        
        // Check max unlocks per session
        const maxUnlocks = settings.challengeSettings.maxUnlocksPerSession || 3;
        const unlocksInSession = await TemporaryUnlock.countDocuments({
            userId,
            sessionId: activeSession._id,
            isActive: true
        });
        
        const expiredUnlocks = await TemporaryUnlock.countDocuments({
            userId,
            sessionId: activeSession._id,
            isActive: false
        });
        
        const totalUnlocks = unlocksInSession + expiredUnlocks;
        
        if (totalUnlocks >= maxUnlocks) {
            return res.status(403).json({ 
                message: `Maximum unlocks (${maxUnlocks}) reached for this session`,
                maxUnlocks,
                used: totalUnlocks
            });
        }
        
        // Generate challenge
        const challengeData = generateChallenge(challengeType, difficulty);
        
        // Create challenge in database
        const challenge = new Challenge({
            userId,
            sessionId: activeSession._id,
            type: challengeData.type,
            difficulty: challengeData.difficulty,
            content: challengeData.content,
            unlockedDomain: domain,
            unlockDuration: settings.challengeSettings.unlockDuration || 15
        });
        
        await challenge.save();
        
        // Return challenge to client (without correct answer for security)
        const clientChallenge = {
            id: challenge._id,
            type: challenge.type,
            difficulty: challenge.difficulty,
            content: {
                ...challenge.content,
                correctAnswer: undefined  // Don't send answer to client
            },
            xpReward: XP_REWARDS[challengeData.type][difficulty],
            unlockDuration: challenge.unlockDuration,
            remainingUnlocks: maxUnlocks - totalUnlocks - 1
        };
        
        res.status(201).json(clientChallenge);
    } catch (error) {
        console.error('Error generating challenge:', error);
        res.status(500).json({ message: error.message });
    }
};

// Verify challenge completion
export const verifyChallenge = async (req, res) => {
    try {
        const { id } = req.params;
        const { userAnswer, timeTaken } = req.body;
        
        // Find challenge
        const challenge = await Challenge.findById(id);
        if (!challenge) {
            return res.status(404).json({ message: 'Challenge not found' });
        }
        
        // Check if already completed
        if (challenge.completedAt) {
            return res.status(400).json({ message: 'Challenge already completed' });
        }
        
        // Verify answer
        const isCorrect = verifyChallengeAnswer(challenge, userAnswer, timeTaken);
        
        // Update challenge
        challenge.success = isCorrect;
        challenge.completedAt = new Date();
        challenge.timeTaken = timeTaken;
        challenge.content.userAnswer = userAnswer;
        
        if (isCorrect) {
            // Award XP
            const xpAwarded = XP_REWARDS[challenge.type][challenge.difficulty];
            challenge.xpAwarded = xpAwarded;
            
            // Update user XP and level
            const user = await User.findById(challenge.userId);
            if (user) {
                user.xp = (user.xp || 0) + xpAwarded;
                user.level = calculateLevel(user.xp);
                await user.save();
            }
            
            // Create temporary unlock
            const unlockDuration = challenge.unlockDuration; // minutes
            const expiresAt = new Date(Date.now() + unlockDuration * 60 * 1000);
            
            const temporaryUnlock = new TemporaryUnlock({
                userId: challenge.userId,
                domain: challenge.unlockedDomain,
                sessionId: challenge.sessionId,
                challengeId: challenge._id,
                duration: unlockDuration,
                expiresAt,
                isActive: true
            });
            
            await temporaryUnlock.save();
            
            await challenge.save();
            
            res.json({
                success: true,
                xpAwarded,
                unlockDuration,
                expiresAt,
                temporaryUnlockId: temporaryUnlock._id,
                message: 'Challenge completed successfully!'
            });
        } else {
            await challenge.save();
            
            res.json({
                success: false,
                message: 'Challenge failed. Try again!'
            });
        }
    } catch (error) {
        console.error('Error verifying challenge:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get user's challenge history
export const getUserChallenges = async (req, res) => {
    try {
        const { userId } = req.params;
        const { limit = 50, skip = 0, type, success } = req.query;
        
        const query = { userId };
        if (type) query.type = type;
        if (success !== undefined) query.success = success === 'true';
        
        const challenges = await Challenge.find(query)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip(parseInt(skip))
            .populate('sessionId', 'startTime endTime duration');
        
        const total = await Challenge.countDocuments(query);
        
        res.json({
            challenges,
            total,
            limit: parseInt(limit),
            skip: parseInt(skip)
        });
    } catch (error) {
        console.error('Error fetching user challenges:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get challenge statistics
export const getChallengeStats = async (req, res) => {
    try {
        const userId = req.user._id || req.user.id;
        
        // Total challenges
        const totalChallenges = await Challenge.countDocuments({ userId });
        
        // Successful challenges
        const successfulChallenges = await Challenge.countDocuments({ userId, success: true });
        
        // Success rate
        const successRate = totalChallenges > 0 ? (successfulChallenges / totalChallenges * 100).toFixed(1) : 0;
        
        // By type
        const byType = await Challenge.aggregate([
            { $match: { userId } },
            {
                $group: {
                    _id: '$type',
                    total: { $sum: 1 },
                    successful: {
                        $sum: { $cond: ['$success', 1, 0] }
                    },
                    totalXP: { $sum: '$xpAwarded' },
                    avgTime: { $avg: '$timeTaken' }
                }
            }
        ]);
        
        // Recent challenges (last 7 days)
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const recentChallenges = await Challenge.countDocuments({
            userId,
            createdAt: { $gte: sevenDaysAgo }
        });
        
        // Total XP earned from challenges
        const xpStats = await Challenge.aggregate([
            { $match: { userId, success: true } },
            {
                $group: {
                    _id: null,
                    totalXP: { $sum: '$xpAwarded' }
                }
            }
        ]);
        
        const totalXP = xpStats.length > 0 ? xpStats[0].totalXP : 0;
        
        res.json({
            totalChallenges,
            successfulChallenges,
            failedChallenges: totalChallenges - successfulChallenges,
            successRate: parseFloat(successRate),
            totalXP,
            recentChallenges,
            byType
        });
    } catch (error) {
        console.error('Error fetching challenge stats:', error);
        res.status(500).json({ message: error.message });
    }
};

export default {
    generateNewChallenge,
    verifyChallenge,
    getUserChallenges,
    getChallengeStats
};
