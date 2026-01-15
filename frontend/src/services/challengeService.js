import { API_BASE_URL } from '../config/apiConfig';
import { getToken } from './authService';

// Generate a new challenge
export async function generateChallenge(userId, domain, type = null) {
  const token = getToken();
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(`${API_BASE_URL}/api/challenges/generate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userId,
      domain,
      type
    }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.message || 'Failed to generate challenge');
  }

  return data;
}

// Verify challenge completion
export async function verifyChallenge(challengeId, userAnswer, timeTaken) {
  const token = getToken();
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(`${API_BASE_URL}/api/challenges/${challengeId}/verify`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userAnswer,
      timeTaken
    }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.message || 'Failed to verify challenge');
  }

  return data;
}

// Get user's challenge history
export async function getUserChallenges(userId, options = {}) {
  const token = getToken();
  if (!token) {
    throw new Error('No authentication token found');
  }

  const queryParams = new URLSearchParams();
  if (options.limit) queryParams.append('limit', options.limit);
  if (options.skip) queryParams.append('skip', options.skip);
  if (options.type) queryParams.append('type', options.type);
  if (options.success !== undefined) queryParams.append('success', options.success);

  const response = await fetch(`${API_BASE_URL}/api/challenges/user/${userId}?${queryParams}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.message || 'Failed to fetch challenges');
  }

  return data;
}

// Get challenge statistics
export async function getChallengeStats() {
  const token = getToken();
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(`${API_BASE_URL}/api/challenges/stats`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.message || 'Failed to fetch challenge stats');
  }

  return data;
}

// Get active unlocks
export async function getActiveUnlocks() {
  const token = getToken();
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(`${API_BASE_URL}/api/temporary-unlocks/active`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.message || 'Failed to fetch active unlocks');
  }

  return data;
}

// Check if domain is unlocked
export async function checkDomainUnlock(domain) {
  const token = getToken();
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(`${API_BASE_URL}/api/temporary-unlocks/check/${domain}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.message || 'Failed to check domain unlock');
  }

  return data;
}

// Get unlocks for current session
export async function getSessionUnlocks() {
  const token = getToken();
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(`${API_BASE_URL}/api/temporary-unlocks/session`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.message || 'Failed to fetch session unlocks');
  }

  return data;
}

// Revoke an unlock
export async function revokeUnlock(unlockId) {
  const token = getToken();
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(`${API_BASE_URL}/api/temporary-unlocks/${unlockId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.message || 'Failed to revoke unlock');
  }

  return data;
}

// Get unlock history
export async function getUnlockHistory(options = {}) {
  const token = getToken();
  if (!token) {
    throw new Error('No authentication token found');
  }

  const queryParams = new URLSearchParams();
  if (options.limit) queryParams.append('limit', options.limit);
  if (options.skip) queryParams.append('skip', options.skip);

  const response = await fetch(`${API_BASE_URL}/api/temporary-unlocks/history?${queryParams}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.message || 'Failed to fetch unlock history');
  }

  return data;
}
