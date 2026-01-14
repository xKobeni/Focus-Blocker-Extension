import UsageMetric from '../models/UsageMetric.model.js';
import mongoose from 'mongoose';
import { checkUsageAchievements } from '../utils/usageAchievementHelper.js';

// Get all usage metrics for a user
export const getUserUsageMetrics = async (req, res) => {
    try {
        const { userId } = req.params;
        const { startDate, endDate, domain, category } = req.query;
        
        // Convert userId to ObjectId if it's a string
        const query = { 
            userId: mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : userId 
        };
        
        if (startDate || endDate) {
            query.visitDate = {};
            if (startDate) query.visitDate.$gte = new Date(startDate);
            if (endDate) query.visitDate.$lte = new Date(endDate);
        }
        
        if (domain) query.domain = domain;
        if (category) query.category = category;
        
        console.log('📊 Querying usage metrics with:', query);
        
        const metrics = await UsageMetric.find(query)
            .sort({ visitDate: -1 })
            .limit(1000);
        
        console.log(`📊 Found ${metrics.length} usage metrics`);
        
        res.json(metrics);
    } catch (error) {
        console.error('❌ Error fetching usage metrics:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get aggregated usage statistics
export const getUsageStatistics = async (req, res) => {
    try {
        const { userId } = req.params;
        const { startDate, endDate } = req.query;
        
        // Convert userId to ObjectId if it's a string
        const query = { 
            userId: mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : userId 
        };
        
        if (startDate || endDate) {
            query.visitDate = {};
            if (startDate) query.visitDate.$gte = new Date(startDate);
            if (endDate) query.visitDate.$lte = new Date(endDate);
        }
        
        console.log('📊 Querying usage statistics with:', query);
        
        // Aggregate by domain
        const domainStats = await UsageMetric.aggregate([
            { $match: query },
            {
                $group: {
                    _id: '$domain',
                    totalTime: { $sum: '$timeSpent' },
                    visitCount: { $sum: '$visitCount' },
                    category: { $first: '$category' }
                }
            },
            { $sort: { totalTime: -1 } },
            { $limit: 50 }
        ]);
        
        // Aggregate by category
        const categoryStats = await UsageMetric.aggregate([
            { $match: query },
            {
                $group: {
                    _id: '$category',
                    totalTime: { $sum: '$timeSpent' },
                    visitCount: { $sum: '$visitCount' }
                }
            },
            { $sort: { totalTime: -1 } }
        ]);
        
        // Daily usage
        const dailyStats = await UsageMetric.aggregate([
            { $match: query },
            {
                $group: {
                    _id: {
                        $dateToString: { format: '%Y-%m-%d', date: '$visitDate' }
                    },
                    totalTime: { $sum: '$timeSpent' },
                    visitCount: { $sum: '$visitCount' }
                }
            },
            { $sort: { _id: -1 } },
            { $limit: 30 }
        ]);
        
        console.log(`📊 Statistics: ${domainStats.length} domains, ${categoryStats.length} categories, ${dailyStats.length} days`);
        
        res.json({
            domainStats,
            categoryStats,
            dailyStats
        });
    } catch (error) {
        console.error('❌ Error fetching usage statistics:', error);
        res.status(500).json({ message: error.message });
    }
};

// Create or update usage metric
export const recordUsage = async (req, res) => {
    try {
        // Use authenticated user's ID from middleware
        const userId = req.user?.userId || req.body.userId;
        const { domain, url, timeSpent, category, isBlocked } = req.body;
        
        // Find existing metric for today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const existing = await UsageMetric.findOne({
            userId,
            domain,
            visitDate: { $gte: today, $lt: tomorrow }
        });
        
        if (existing) {
            existing.timeSpent += timeSpent || 0;
            existing.visitCount += 1;
            existing.isBlocked = isBlocked || existing.isBlocked;
            existing.updatedAt = new Date();
            await existing.save();
            
            // Check for achievements (async, don't wait)
            checkUsageAchievements(userId).catch(err => 
                console.error('Error checking achievements:', err)
            );
            
            res.json(existing);
        } else {
            const metric = new UsageMetric({
                userId,
                domain,
                url,
                timeSpent: timeSpent || 0,
                visitCount: 1,
                category: category || 'other',
                isBlocked: isBlocked || false,
                visitDate: new Date()
            });
            await metric.save();
            
            // Check for achievements (async, don't wait)
            checkUsageAchievements(userId).catch(err => 
                console.error('Error checking achievements:', err)
            );
            
            res.status(201).json(metric);
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Delete usage metrics
export const deleteUsageMetrics = async (req, res) => {
    try {
        const { userId } = req.params;
        const { startDate, endDate } = req.query;
        
        const query = { userId };
        if (startDate || endDate) {
            query.visitDate = {};
            if (startDate) query.visitDate.$gte = new Date(startDate);
            if (endDate) query.visitDate.$lte = new Date(endDate);
        }
        
        await UsageMetric.deleteMany(query);
        res.json({ message: 'Usage metrics deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Check and award usage achievements
export const checkAchievements = async (req, res) => {
    try {
        const userId = req.user?.userId || req.params.userId;
        if (!userId) {
            return res.status(400).json({ message: 'User ID is required' });
        }
        
        const newAchievements = await checkUsageAchievements(userId);
        res.json({
            message: `Checked achievements. ${newAchievements.length} new achievement(s) unlocked.`,
            newAchievements
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
