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

// Alias functions for store compatibility
export async function getUserUsageStats(userId, options = {}) {
  return getUsageStatistics(userId, options);
}

export async function createUsageMetric(userId, metricData) {
  return recordUsage({ ...metricData, userId });
}

export async function getUsageMetricById(metricId) {
  const token = getToken();
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(`${API_BASE_URL}/api/usage-metrics/${metricId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.message || 'Failed to fetch usage metric');
  }

  return data;
}

export async function updateUsageMetric(metricId, metricData) {
  const token = getToken();
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(`${API_BASE_URL}/api/usage-metrics/${metricId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(metricData),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.message || 'Failed to update usage metric');
  }

  return data;
}

export async function deleteUsageMetric(metricId) {
  const token = getToken();
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(`${API_BASE_URL}/api/usage-metrics/${metricId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.message || 'Failed to delete usage metric');
  }

  return data;
}

export async function trackSiteVisit(userId, domain, duration) {
  return createUsageMetric(userId, {
    domain,
    duration,
    timestamp: new Date().toISOString()
  });
}

export async function getTopSites(userId, limit = 10) {
  const metrics = await getUserUsageMetrics(userId);
  
  // Aggregate by domain
  const domainMap = {};
  metrics.forEach(metric => {
    if (!domainMap[metric.domain]) {
      domainMap[metric.domain] = {
        domain: metric.domain,
        totalTime: 0,
        visits: 0
      };
    }
    domainMap[metric.domain].totalTime += metric.duration || 0;
    domainMap[metric.domain].visits += 1;
  });
  
  // Sort by total time and return top N
  return Object.values(domainMap)
    .sort((a, b) => b.totalTime - a.totalTime)
    .slice(0, limit);
}
