import TemporaryUnlock from '../models/TemporaryUnlock.model.js';
import FocusSession from '../models/FocusSession.model.js';

// Get all active unlocks for a user
export const getActiveUnlocks = async (req, res) => {
    try {
        const userId = req.user._id || req.user.id;
        
        // Cleanup expired unlocks first
        await TemporaryUnlock.cleanupExpired();
        
        const unlocks = await TemporaryUnlock.find({
            userId,
            isActive: true,
            expiresAt: { $gt: new Date() }
        })
        .populate('challengeId', 'type difficulty xpAwarded')
        .populate('sessionId', 'startTime')
        .sort({ grantedAt: -1 });
        
        res.json(unlocks);
    } catch (error) {
        console.error('Error fetching active unlocks:', error);
        res.status(500).json({ message: error.message });
    }
};

// Check if a specific domain is currently unlocked
export const checkDomainUnlock = async (req, res) => {
    try {
        const { domain } = req.params;
        const userId = req.user._id || req.user.id;
        
        // Clean domain
        const cleanDomain = domain.toLowerCase().replace(/^www\./, '');
        
        // Cleanup expired unlocks
        await TemporaryUnlock.cleanupExpired();
        
        // Find active unlock for this domain
        const unlock = await TemporaryUnlock.getActiveUnlock(userId, cleanDomain);
        
        if (unlock) {
            // Update last accessed time
            unlock.lastAccessedAt = new Date();
            if (!unlock.wasUsed) {
                unlock.wasUsed = true;
                unlock.firstAccessedAt = new Date();
            }
            await unlock.save();
            
            // Calculate remaining time
            const remainingMs = unlock.expiresAt - Date.now();
            const remainingMinutes = Math.floor(remainingMs / 1000 / 60);
            const remainingSeconds = Math.floor((remainingMs / 1000) % 60);
            
            res.json({
                isUnlocked: true,
                unlock: {
                    id: unlock._id,
                    domain: unlock.domain,
                    expiresAt: unlock.expiresAt,
                    remainingMinutes,
                    remainingSeconds,
                    grantedAt: unlock.grantedAt
                }
            });
        } else {
            res.json({
                isUnlocked: false,
                message: 'Domain is not currently unlocked'
            });
        }
    } catch (error) {
        console.error('Error checking domain unlock:', error);
        res.status(500).json({ message: error.message });
    }
};

// Revoke/end an unlock early
export const revokeUnlock = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id || req.user.id;
        
        const unlock = await TemporaryUnlock.findOne({
            _id: id,
            userId,
            isActive: true
        });
        
        if (!unlock) {
            return res.status(404).json({ message: 'Active unlock not found' });
        }
        
        await unlock.revoke('user');
        
        res.json({
            message: 'Unlock revoked successfully',
            unlock
        });
    } catch (error) {
        console.error('Error revoking unlock:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get unlock history for a user
export const getUnlockHistory = async (req, res) => {
    try {
        const userId = req.user._id || req.user.id;
        const { limit = 50, skip = 0 } = req.query;
        
        const unlocks = await TemporaryUnlock.find({ userId })
            .populate('challengeId', 'type difficulty xpAwarded success')
            .populate('sessionId', 'startTime endTime duration')
            .sort({ grantedAt: -1 })
            .limit(parseInt(limit))
            .skip(parseInt(skip));
        
        const total = await TemporaryUnlock.countDocuments({ userId });
        
        res.json({
            unlocks,
            total,
            limit: parseInt(limit),
            skip: parseInt(skip)
        });
    } catch (error) {
        console.error('Error fetching unlock history:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get unlocks for current session
export const getSessionUnlocks = async (req, res) => {
    try {
        const userId = req.user._id || req.user.id;
        
        // Find active session
        const activeSession = await FocusSession.findOne({
            userId,
            endTime: null
        });
        
        if (!activeSession) {
            return res.status(404).json({ message: 'No active session found' });
        }
        
        // Cleanup expired unlocks
        await TemporaryUnlock.cleanupExpired();
        
        // Get all unlocks for this session
        const unlocks = await TemporaryUnlock.find({
            userId,
            sessionId: activeSession._id
        })
        .populate('challengeId', 'type difficulty xpAwarded')
        .sort({ grantedAt: -1 });
        
        // Count active vs expired
        const active = unlocks.filter(u => u.isActive).length;
        const expired = unlocks.filter(u => !u.isActive).length;
        
        res.json({
            sessionId: activeSession._id,
            total: unlocks.length,
            active,
            expired,
            unlocks
        });
    } catch (error) {
        console.error('Error fetching session unlocks:', error);
        res.status(500).json({ message: error.message });
    }
};

// Cleanup expired unlocks (admin/cron endpoint)
export const cleanupExpiredUnlocks = async (req, res) => {
    try {
        const result = await TemporaryUnlock.cleanupExpired();
        
        res.json({
            message: 'Expired unlocks cleaned up successfully',
            modifiedCount: result.modifiedCount
        });
    } catch (error) {
        console.error('Error cleaning up expired unlocks:', error);
        res.status(500).json({ message: error.message });
    }
};

export default {
    getActiveUnlocks,
    checkDomainUnlock,
    revokeUnlock,
    getUnlockHistory,
    getSessionUnlocks,
    cleanupExpiredUnlocks
};
