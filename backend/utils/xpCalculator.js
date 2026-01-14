// XP calculation utilities

// Base XP values for different activities
export const XP_VALUES = {
    FOCUS_SESSION: 10, // Base XP per minute of focus
    DAILY_GOAL: 50, // XP for completing daily goal
    WEEKLY_GOAL: 200, // XP for completing weekly goal
    STREAK_BONUS: 5, // Bonus XP per day of streak
    ACHIEVEMENT: 100, // XP for unlocking achievement
    FIRST_SESSION: 25, // Bonus XP for first session of the day
};

// Calculate XP from focus session duration (in minutes)
export const calculateSessionXP = (durationMinutes, isFirstSession = false) => {
    let xp = durationMinutes * XP_VALUES.FOCUS_SESSION;
    
    if (isFirstSession) {
        xp += XP_VALUES.FIRST_SESSION;
    }
    
    return Math.floor(xp);
};

// Calculate streak bonus XP
export const calculateStreakBonus = (streakDays) => {
    return Math.floor(streakDays * XP_VALUES.STREAK_BONUS);
};

// Calculate total XP for a focus session
export const calculateTotalSessionXP = (durationMinutes, streakDays, isFirstSession = false) => {
    const sessionXP = calculateSessionXP(durationMinutes, isFirstSession);
    const streakBonus = calculateStreakBonus(streakDays);
    return sessionXP + streakBonus;
};

// Calculate XP for completing a goal
export const calculateGoalXP = (goalType) => {
    switch (goalType) {
        case 'daily':
            return XP_VALUES.DAILY_GOAL;
        case 'weekly':
            return XP_VALUES.WEEKLY_GOAL;
        default:
            return 0;
    }
};

// Calculate XP for achievement
export const calculateAchievementXP = () => {
    return XP_VALUES.ACHIEVEMENT;
};

// Calculate total XP with multipliers
export const calculateXPWithMultiplier = (baseXP, multiplier = 1) => {
    return Math.floor(baseXP * multiplier);
};
