import { isSameDay, isYesterday, startOfDay } from './dateUtils.js';

// Streak calculation utilities

// Check if user should get streak credit for today
export const shouldIncrementStreak = (lastFocusDate) => {
    if (!lastFocusDate) {
        return true; // First time, start streak
    }

    const lastDate = new Date(lastFocusDate);
    const today = new Date();
    
    // If last focus was today, don't increment (already counted)
    if (isSameDay(lastDate, today)) {
        return false;
    }
    
    // If last focus was yesterday, increment streak
    if (isYesterday(lastDate)) {
        return true;
    }
    
    // If last focus was more than 1 day ago, reset streak
    return false;
};

// Calculate new streak value
export const calculateStreak = (currentStreak, lastFocusDate) => {
    if (!lastFocusDate) {
        return 1; // First session
    }

    const lastDate = new Date(lastFocusDate);
    const today = new Date();
    
    if (isSameDay(lastDate, today)) {
        return currentStreak; // Already counted today
    }
    
    if (isYesterday(lastDate)) {
        return currentStreak + 1; // Increment streak
    }
    
    return 1; // Reset streak (more than 1 day gap)
};

// Update longest streak if current streak is longer
export const updateLongestStreak = (currentStreak, longestStreak) => {
    return Math.max(currentStreak, longestStreak);
};

// Check if streak is at risk (no focus yesterday)
export const isStreakAtRisk = (lastFocusDate) => {
    if (!lastFocusDate) {
        return false;
    }
    
    const lastDate = new Date(lastFocusDate);
    const today = new Date();
    
    // If last focus was 2 days ago, streak is at risk
    const daysDiff = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));
    return daysDiff >= 2;
};

// Get streak status message
export const getStreakStatus = (streak, lastFocusDate) => {
    if (streak === 0) {
        return 'Start your focus streak today!';
    }
    
    if (isStreakAtRisk(lastFocusDate)) {
        return `Your ${streak}-day streak is at risk! Focus today to keep it going.`;
    }
    
    return `You're on a ${streak}-day streak! Keep it up!`;
};

// Calculate streak milestones
export const getStreakMilestone = (streak) => {
    const milestones = [7, 14, 30, 60, 90, 100, 180, 365];
    
    for (const milestone of milestones) {
        if (streak >= milestone && streak < milestone + 1) {
            return {
                milestone,
                message: `Congratulations! You've reached a ${milestone}-day streak!`
            };
        }
    }
    
    return null;
};
