// API Configuration
const API_BASE_URL = "http://localhost:5000/api";
const FRONTEND_URL = "http://localhost:5173";

// Expose FRONTEND_URL to window for access from other scripts
if (typeof window !== 'undefined') {
  window.FRONTEND_URL = FRONTEND_URL;
}

// API Endpoints
const API_ENDPOINTS = {
  auth: {
    login: `${API_BASE_URL}/auth/login`,
    register: `${API_BASE_URL}/auth/register`,
    verify: `${API_BASE_URL}/auth/verify`,
    me: `${API_BASE_URL}/auth/me`
  },
  focusSessions: {
    getAll: `${API_BASE_URL}/focus-sessions`,
    create: `${API_BASE_URL}/focus-sessions`,
    getById: (id) => `${API_BASE_URL}/focus-sessions/${id}`,
    end: (id) => `${API_BASE_URL}/focus-sessions/${id}/end`,
    delete: (id) => `${API_BASE_URL}/focus-sessions/${id}`
  },
  blockedSites: {
    getAll: `${API_BASE_URL}/blocked-sites`,
    create: `${API_BASE_URL}/blocked-sites`,
    getById: (id) => `${API_BASE_URL}/blocked-sites/${id}`,
    delete: (id) => `${API_BASE_URL}/blocked-sites/${id}`
  }
};
