import Achievement from '../models/Achievement.model.js';
import UsageMetric from '../models/UsageMetric.model.js';
import mongoose from 'mongoose';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get directory path for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load achievement definitions from JSON file
let USAGE_ACHIEVEMENTS = [];
try {
    const achievementsPath = join(__dirname, '../data/usageAchievements.json');
    const achievementsData = readFileSync(achievementsPath, 'utf8');
    USAGE_ACHIEVEMENTS = JSON.parse(achievementsData);
    console.log(`✅ Loaded ${USAGE_ACHIEVEMENTS.length} usage achievements from JSON`);
} catch (error) {
    console.error('❌ Error loading usage achievements JSON:', error);
}

/**
 * Check achievement criteria based on type
 */
async function checkAchievementCriteria(achievementDef, userId) {
    const userIdObj = mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : userId;
    
    switch (achievementDef.type) {
        case 'count':
            if (achievementDef.field === 'totalMetrics') {
                const count = await UsageMetric.countDocuments({ userId });
                return count >= achievementDef.threshold;
            }
            return false;
            
        case 'uniqueDomains':
            const uniqueDomains = await UsageMetric.distinct('domain', { userId });
            return uniqueDomains.length >= achievementDef.threshold;
            
        case 'totalTime':
            const totalTimeResult = await UsageMetric.aggregate([
                { $match: { userId: userIdObj } },
                { $group: { _id: null, totalTime: { $sum: '$timeSpent' } } }
            ]);
            const totalSeconds = totalTimeResult[0]?.totalTime || 0;
            return totalSeconds >= achievementDef.threshold;
            
        case 'consecutiveDays':
            const daysAgo = new Date();
            daysAgo.setDate(daysAgo.getDate() - achievementDef.threshold);
            
            const dailyUsage = await UsageMetric.aggregate([
                {
                    $match: {
                        userId: userIdObj,
                        visitDate: { $gte: daysAgo }
                    }
                },
                {
                    $group: {
                        _id: {
                            $dateToString: { format: '%Y-%m-%d', date: '$visitDate' }
                        }
                    }
                }
            ]);
            
            return dailyUsage.length >= achievementDef.threshold;
            
        case 'categoryTime':
            const categoryTimeResult = await UsageMetric.aggregate([
                {
                    $match: {
                        userId: userIdObj,
                        category: achievementDef.category
                    }
                },
                { $group: { _id: null, totalTime: { $sum: '$timeSpent' } } }
            ]);
            const categorySeconds = categoryTimeResult[0]?.totalTime || 0;
            return categorySeconds >= achievementDef.threshold;
            
        case 'categoryDomains':
            const categorySites = await UsageMetric.distinct('domain', {
                userId,
                category: achievementDef.category
            });
            return categorySites.length >= achievementDef.threshold;
            
        case 'dailyUniqueDomains':
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            
            const dailyUniqueDomains = await UsageMetric.distinct('domain', {
                userId,
                visitDate: { $gte: today, $lt: tomorrow }
            });
            
            return dailyUniqueDomains.length >= achievementDef.threshold;
            
        case 'dailyTotalTime':
            const dailyStart = new Date();
            dailyStart.setHours(0, 0, 0, 0);
            const dailyEnd = new Date(dailyStart);
            dailyEnd.setDate(dailyEnd.getDate() + 1);
            
            const dailyTimeResult = await UsageMetric.aggregate([
                {
                    $match: {
                        userId: userIdObj,
                        visitDate: { $gte: dailyStart, $lt: dailyEnd }
                    }
                },
                { $group: { _id: null, totalTime: { $sum: '$timeSpent' } } }
            ]);
            
            const dailySeconds = dailyTimeResult[0]?.totalTime || 0;
            return dailySeconds >= achievementDef.threshold;
            
        default:
            console.warn(`Unknown achievement type: ${achievementDef.type}`);
            return false;
    }
}

/**
 * Check and award usage-based achievements
 * @param {string|ObjectId} userId - The user ID
 * @returns {Promise<Array>} Array of newly awarded achievements
 */
export async function checkUsageAchievements(userId) {
    const newAchievements = [];
    
    try {
        // Get all existing achievements for this user
        const existingAchievements = await Achievement.find({ userId });
        const existingTitles = new Set(existingAchievements.map(a => a.title));
        
        // Check each achievement from JSON file
        for (const achievementDef of USAGE_ACHIEVEMENTS) {
            // Skip if user already has this achievement
            if (existingTitles.has(achievementDef.title)) {
                continue;
            }
            
            // Check if achievement criteria is met
            try {
                const criteriaMet = await checkAchievementCriteria(achievementDef, userId);
                
                if (criteriaMet) {
                    // Award the achievement
                    const achievement = new Achievement({
                        userId,
                        title: achievementDef.title,
                        description: achievementDef.description,
                        icon: achievementDef.icon,
                        unlockedAt: new Date()
                    });
                    
                    await achievement.save();
                    newAchievements.push(achievement);
                    
                    console.log(`🏆 Achievement unlocked: ${achievementDef.title} for user ${userId}`);
                }
            } catch (error) {
                console.error(`Error checking achievement "${achievementDef.title}":`, error);
            }
        }
    } catch (error) {
        console.error('Error checking usage achievements:', error);
    }
    
    return newAchievements;
}
