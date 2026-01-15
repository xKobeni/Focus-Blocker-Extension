import { API_BASE_URL } from '../config/apiConfig';
import { getToken } from './authService';

// Get custom block page
export async function getCustomBlockPage(userId) {
  const token = getToken();
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(`${API_BASE_URL}/api/custom-block-page/user/${userId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.message || 'Failed to fetch custom block page');
  }

  return data;
}

// Create or update custom block page
export async function upsertCustomBlockPage(userId, pageData) {
  const token = getToken();
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(`${API_BASE_URL}/api/custom-block-page/user/${userId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(pageData),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.message || 'Failed to save custom block page');
  }

  return data;
}

// Alias functions for store compatibility
export async function getUserCustomBlockPage(userId) {
  return getCustomBlockPage(userId);
}

export async function createCustomBlockPage(userId, pageData) {
  return upsertCustomBlockPage(userId, pageData);
}

export async function updateCustomBlockPage(pageId, pageData) {
  // pageId is typically the userId for custom block pages
  return upsertCustomBlockPage(pageId, pageData);
}

export async function deleteCustomBlockPage(pageId) {
  const token = getToken();
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(`${API_BASE_URL}/api/custom-block-page/${pageId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.message || 'Failed to delete custom block page');
  }

  return data;
}
