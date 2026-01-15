import { API_BASE_URL } from '../config/apiConfig';
import { getToken } from './authService';

// Get all focus sessions for the current user
export async function getUserFocusSessions(userId) {
  const token = getToken();
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(`${API_BASE_URL}/api/focus-sessions/user/${userId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.message || 'Failed to fetch focus sessions');
  }

  return data;
}

// Get active focus sessions for the current user
export async function getActiveFocusSessions(userId) {
  const token = getToken();
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(`${API_BASE_URL}/api/focus-sessions/user/${userId}/active`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    // Handle rate limiting specifically
    if (response.status === 429) {
      throw new Error('Too many requests, please try again later');
    }
    throw new Error(data?.message || 'Failed to fetch active sessions');
  }

  return data;
}

// Create a new focus session
export async function createFocusSession(userId) {
  const token = getToken();
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(`${API_BASE_URL}/api/focus-sessions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userId,
      startTime: new Date(),
      source: 'web',
    }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    // Handle rate limiting specifically
    if (response.status === 429) {
      throw new Error('Too many requests, please try again later');
    }
    throw new Error(data?.message || 'Failed to create focus session');
  }

  return data;
}

// End a focus session
export async function endFocusSession(sessionId, distractions = 0) {
  const token = getToken();
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(`${API_BASE_URL}/api/focus-sessions/${sessionId}/end`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ distractions }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.message || 'Failed to end focus session');
  }

  return data;
}

// Calculate user statistics from sessions
export function calculateSessionStats(sessions) {
  if (!sessions || sessions.length === 0) {
    return {
      totalSessions: 0,
      totalMinutes: 0,
      totalHours: 0,
      averageMinutes: 0,
      totalDistractions: 0,
      averageDistractions: 0,
      sessionsThisWeek: 0,
      sessionsThisMonth: 0,
    };
  }

  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const completedSessions = sessions.filter(s => s.endTime && s.duration);

  const totalMinutes = completedSessions.reduce((sum, s) => sum + (s.duration || 0), 0);
  const totalDistractions = completedSessions.reduce((sum, s) => sum + (s.distractions || 0), 0);
  
  const sessionsThisWeek = completedSessions.filter(s => 
    new Date(s.createdAt) >= oneWeekAgo
  ).length;
  
  const sessionsThisMonth = completedSessions.filter(s => 
    new Date(s.createdAt) >= oneMonthAgo
  ).length;

  return {
    totalSessions: completedSessions.length,
    totalMinutes,
    totalHours: Math.floor(totalMinutes / 60),
    averageMinutes: completedSessions.length > 0 
      ? Math.round(totalMinutes / completedSessions.length) 
      : 0,
    totalDistractions,
    averageDistractions: completedSessions.length > 0 
      ? Math.round(totalDistractions / completedSessions.length) 
      : 0,
    sessionsThisWeek,
    sessionsThisMonth,
  };
}
