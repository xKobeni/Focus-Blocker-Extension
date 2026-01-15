import { API_BASE_URL } from '../config/apiConfig';
import { getToken } from './authService';

// Get user settings by user ID
export async function getUserSettings(userId) {
  const token = getToken();
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(`${API_BASE_URL}/api/user-settings/user/${userId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.message || 'Failed to fetch user settings');
  }

  return data;
}

// Update user settings (upsert - creates if not exists)
export async function updateUserSettings(userId, settings) {
  const token = getToken();
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(`${API_BASE_URL}/api/user-settings/user/${userId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(settings),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.message || 'Failed to update user settings');
  }

  return data;
}

// Create user settings (if not exists) - now just uses upsert
export async function createUserSettings(userId, settings) {
  // Use the upsert endpoint which handles both create and update
  return updateUserSettings(userId, settings);
}
