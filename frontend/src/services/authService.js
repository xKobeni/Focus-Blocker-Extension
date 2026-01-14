import { API_BASE_URL } from '../config/apiConfig';
import { jwtDecode } from 'jwt-decode';

// Initiate Google OAuth login
export function initiateGoogleLogin() {
  window.location.href = `${API_BASE_URL}/api/auth/google`;
}

// Register a new user
export async function register({ email, password, name }) {
  const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password, name }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data?.message || 'Failed to register';
    throw new Error(message);
  }

  // data: { message, user, token }
  if (data?.token) {
    localStorage.setItem('auth_token', data.token);
  }

  return data;
}

// Login user
export async function login({ email, password }) {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data?.message || 'Failed to login';
    throw new Error(message);
  }

  // data: { message, user, token }
  if (data?.token) {
    localStorage.setItem('auth_token', data.token);
  }

  return data;
}

// Logout user (clear token from storage)
export function logout() {
  localStorage.removeItem('auth_token');
}

// Get stored token
export function getToken() {
  return localStorage.getItem('auth_token');
}

// Check if user is authenticated (has valid token)
export function isAuthenticated() {
  const token = getToken();
  if (!token) return false;

  try {
    const decoded = jwtDecode(token);
    // Check if token is expired
    if (decoded.exp && decoded.exp * 1000 < Date.now()) {
      logout(); // Clear expired token
      return false;
    }
    return true;
  } catch (error) {
    console.error('Token verification failed:', error);
    logout(); // Clear invalid token
    return false;
  }
}

// Verify token with backend
export async function verifyToken() {
  const token = getToken();
  if (!token) {
    throw new Error('No token found');
  }

  const response = await fetch(`${API_BASE_URL}/api/auth/verify`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    logout();
    throw new Error(data?.message || 'Token verification failed');
  }

  return data;
}

// Get current user from backend
export async function getCurrentUser() {
  const token = getToken();
  if (!token) {
    throw new Error('No token found');
  }

  const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.message || 'Failed to fetch user');
  }

  return data;
}
