// Statistics calculation utilities

// Calculate total focus time from sessions
export const calculateTotalFocusTime = (sessions) => {
    return sessions.reduce((total, session) => {
        return total + (session.duration || 0);
    }, 0);
};

// Calculate average session duration
export const calculateAverageSessionDuration = (sessions) => {
    if (sessions.length === 0) return 0;
    
    const totalDuration = calculateTotalFocusTime(sessions);
    return Math.round(totalDuration / sessions.length);
};

// Calculate focus time for a specific period
export const calculateFocusTimeForPeriod = (sessions, startDate, endDate) => {
    const filteredSessions = sessions.filter(session => {
        const sessionDate = new Date(session.startTime || session.createdAt);
        return sessionDate >= startDate && sessionDate <= endDate;
    });
    
    return calculateTotalFocusTime(filteredSessions);
};

// Calculate daily focus time
export const calculateDailyFocusTime = (sessions, date) => {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    return calculateFocusTimeForPeriod(sessions, startOfDay, endOfDay);
};

// Calculate weekly focus time
export const calculateWeeklyFocusTime = (sessions, weekStartDate) => {
    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setDate(weekEndDate.getDate() + 6);
    weekEndDate.setHours(23, 59, 59, 999);
    
    return calculateFocusTimeForPeriod(sessions, weekStartDate, weekEndDate);
};

// Calculate monthly focus time
export const calculateMonthlyFocusTime = (sessions, year, month) => {
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);
    
    return calculateFocusTimeForPeriod(sessions, startDate, endDate);
};

// Calculate distraction rate
export const calculateDistractionRate = (sessions) => {
    if (sessions.length === 0) return 0;
    
    const totalDistractions = sessions.reduce((total, session) => {
        return total + (session.distractions || 0);
    }, 0);
    
    return (totalDistractions / sessions.length).toFixed(2);
};

// Calculate completion rate for goals
export const calculateGoalCompletionRate = (goals) => {
    if (goals.length === 0) return 0;
    
    const completedGoals = goals.filter(goal => goal.achieved).length;
    return ((completedGoals / goals.length) * 100).toFixed(2);
};

// Get focus statistics summary
export const getFocusStats = (sessions, goals = []) => {
    const totalSessions = sessions.length;
    const totalFocusTime = calculateTotalFocusTime(sessions);
    const averageDuration = calculateAverageSessionDuration(sessions);
    const distractionRate = calculateDistractionRate(sessions);
    const goalCompletionRate = calculateGoalCompletionRate(goals);
    
    return {
        totalSessions,
        totalFocusTime, // in minutes
        averageDuration, // in minutes
        distractionRate,
        goalCompletionRate: parseFloat(goalCompletionRate),
        totalHours: (totalFocusTime / 60).toFixed(2)
    };
};

// Get weekly statistics
export const getWeeklyStats = (sessions, weekStartDate) => {
    const weeklyTime = calculateWeeklyFocusTime(sessions, weekStartDate);
    const weekSessions = sessions.filter(session => {
        const sessionDate = new Date(session.startTime || session.createdAt);
        const weekEnd = new Date(weekStartDate);
        weekEnd.setDate(weekEnd.getDate() + 6);
        return sessionDate >= weekStartDate && sessionDate <= weekEnd;
    });
    
    return {
        totalFocusTime: weeklyTime,
        sessionCount: weekSessions.length,
        averageDuration: weekSessions.length > 0 ? Math.round(weeklyTime / weekSessions.length) : 0
    };
};
