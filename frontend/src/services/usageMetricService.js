import { API_BASE_URL } from '../config/apiConfig';
import { getToken } from './authService';

// Get usage metrics for a user
export async function getUserUsageMetrics(userId, filters = {}) {
  const token = getToken();
  if (!token) {
    throw new Error('No authentication token found');
  }

  const queryParams = new URLSearchParams();
  if (filters.startDate) queryParams.append('startDate', filters.startDate);
  if (filters.endDate) queryParams.append('endDate', filters.endDate);
  if (filters.domain) queryParams.append('domain', filters.domain);
  if (filters.category) queryParams.append('category', filters.category);

  const response = await fetch(`${API_BASE_URL}/api/usage-metrics/user/${userId}?${queryParams}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.message || 'Failed to fetch usage metrics');
  }

  return data;
}

// Get usage statistics (aggregated)
export async function getUsageStatistics(userId, filters = {}) {
  const token = getToken();
  if (!token) {
    throw new Error('No authentication token found');
  }

  const queryParams = new URLSearchParams();
  if (filters.startDate) queryParams.append('startDate', filters.startDate);
  if (filters.endDate) queryParams.append('endDate', filters.endDate);

  const response = await fetch(`${API_BASE_URL}/api/usage-metrics/user/${userId}/statistics?${queryParams}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.message || 'Failed to fetch usage statistics');
  }

  return data;
}

// Record usage
export async function recordUsage(usageData) {
  const token = getToken();
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(`${API_BASE_URL}/api/usage-metrics`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(usageData),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.message || 'Failed to record usage');
  }

  return data;
}
