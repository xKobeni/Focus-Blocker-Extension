// Level calculation utilities

// XP required for each level (exponential growth)
const calculateXPForLevel = (level) => {
    // Formula: baseXP * (level^1.5)
    const baseXP = 100;
    return Math.floor(baseXP * Math.pow(level, 1.5));
};

// Calculate total XP needed to reach a specific level
export const getTotalXPForLevel = (level) => {
    let totalXP = 0;
    for (let i = 1; i <= level; i++) {
        totalXP += calculateXPForLevel(i);
    }
    return totalXP;
};

// Calculate level from total XP
export const calculateLevel = (totalXP) => {
    let level = 1;
    let xpNeeded = 0;
    
    while (xpNeeded <= totalXP) {
        level++;
        xpNeeded = getTotalXPForLevel(level);
    }
    
    return level - 1;
};

// Calculate XP needed for next level
export const getXPForNextLevel = (currentLevel) => {
    return calculateXPForLevel(currentLevel + 1);
};

// Calculate XP progress to next level
export const getXPProgress = (totalXP, currentLevel) => {
    const xpForCurrentLevel = getTotalXPForLevel(currentLevel);
    const xpForNextLevel = getTotalXPForLevel(currentLevel + 1);
    const xpNeeded = xpForNextLevel - totalXP;
    const xpProgress = totalXP - xpForCurrentLevel;
    const xpRequired = xpForNextLevel - xpForCurrentLevel;
    const progressPercentage = (xpProgress / xpRequired) * 100;
    
    return {
        currentXP: totalXP,
        xpForCurrentLevel,
        xpForNextLevel,
        xpNeeded,
        xpProgress,
        xpRequired,
        progressPercentage: Math.min(100, Math.max(0, progressPercentage))
    };
};

// Get level info
export const getLevelInfo = (totalXP) => {
    const level = calculateLevel(totalXP);
    const progress = getXPProgress(totalXP, level);
    
    return {
        level,
        totalXP,
        ...progress
    };
};
