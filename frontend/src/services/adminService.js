import { API_BASE_URL } from '../config/apiConfig';
import { getToken } from './authService';

// Get all users (admin only)
export async function getAllUsers() {
  const token = getToken();
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(`${API_BASE_URL}/api/users`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.message || 'Failed to fetch users');
  }

  return data;
}

// Update user role (admin only)
export async function updateUserRole(userId, role) {
  const token = getToken();
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ role }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.message || 'Failed to update user role');
  }

  return data;
}

// Delete user (admin only)
export async function deleteUser(userId) {
  const token = getToken();
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.message || 'Failed to delete user');
  }

  return data;
}

// Get all focus sessions (admin can see all)
export async function getAllFocusSessions() {
  const token = getToken();
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(`${API_BASE_URL}/api/focus-sessions`, {
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

// Get all blocked sites (admin can see all)
export async function getAllBlockedSites() {
  const token = getToken();
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(`${API_BASE_URL}/api/blocked-sites`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.message || 'Failed to fetch blocked sites');
  }

  return data;
}

// Get all achievements (admin can see all)
export async function getAllAchievements() {
  const token = getToken();
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(`${API_BASE_URL}/api/achievements`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.message || 'Failed to fetch achievements');
  }

  return data;
}

// Calculate platform statistics
export function calculatePlatformStats(users, sessions, blockedSites, achievements) {
  const totalUsers = users.length;
  const adminUsers = users.filter(u => u.role === 'admin').length;
  const regularUsers = users.filter(u => u.role === 'user').length;
  
  const totalSessions = sessions.length;
  const completedSessions = sessions.filter(s => s.endTime && s.duration).length;
  const totalMinutes = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);
  const totalHours = Math.floor(totalMinutes / 60);
  const averageSessionMinutes = completedSessions > 0 ? Math.round(totalMinutes / completedSessions) : 0;
  
  const totalDistractions = sessions.reduce((sum, s) => sum + (s.distractions || 0), 0);
  const averageDistractions = completedSessions > 0 ? Math.round(totalDistractions / completedSessions) : 0;
  
  const totalBlockedSites = blockedSites.length;
  const activeBlockedSites = blockedSites.filter(s => s.isActive).length;
  
  // Most blocked domains
  const domainCounts = {};
  blockedSites.forEach(site => {
    try {
      const domain = new URL(site.url).hostname;
      domainCounts[domain] = (domainCounts[domain] || 0) + 1;
    } catch {
      domainCounts[site.url] = (domainCounts[site.url] || 0) + 1;
    }
  });
  
  const mostBlockedDomains = Object.entries(domainCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([domain, count]) => ({ domain, count }));
  
  const totalAchievements = achievements.length;
  const averageAchievementsPerUser = totalUsers > 0 ? (totalAchievements / totalUsers).toFixed(1) : 0;
  
  // Top users by XP
  const topUsers = [...users]
    .sort((a, b) => (b.xp || 0) - (a.xp || 0))
    .slice(0, 5)
    .map(u => ({
      id: u._id,
      name: u.name || u.email,
      xp: u.xp || 0,
      level: u.level || 1,
      streak: u.streak || 0,
    }));
  
  return {
    users: {
      total: totalUsers,
      admins: adminUsers,
      regular: regularUsers,
    },
    sessions: {
      total: totalSessions,
      completed: completedSessions,
      totalHours,
      totalMinutes,
      averageMinutes: averageSessionMinutes,
    },
    distractions: {
      total: totalDistractions,
      average: averageDistractions,
    },
    blockedSites: {
      total: totalBlockedSites,
      active: activeBlockedSites,
      mostBlocked: mostBlockedDomains,
    },
    achievements: {
      total: totalAchievements,
      averagePerUser: averageAchievementsPerUser,
    },
    topUsers,
  };
}
