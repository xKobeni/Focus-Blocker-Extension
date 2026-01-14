// API service for extension to communicate with backend

// Make authenticated API request
async function makeAuthRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    getToken(async (token) => {
      if (!token) {
        reject(new Error("No authentication token found"));
        return;
      }

      try {
        const response = await fetch(url, {
          ...options,
          headers: {
            ...options.headers,
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });

        const data = await response.json();

        if (!response.ok) {
          reject(new Error(data.message || "API request failed"));
          return;
        }

        resolve(data);
      } catch (error) {
        reject(error);
      }
    });
  });
}

// Verify current token
async function verifyToken() {
  const url = `${API_BASE_URL}/auth/verify`;
  return makeAuthRequest(url);
}

// Get current user info
async function getCurrentUser() {
  const url = `${API_BASE_URL}/auth/me`;
  return makeAuthRequest(url);
}

// Get all blocked sites for current user
async function getBlockedSites() {
  const url = `${API_BASE_URL}/blocked-sites`;
  return makeAuthRequest(url);
}

// Create a new focus session
async function createFocusSession() {
  // Get current user to get userId
  const user = await getCurrentUser();
  
  const url = `${API_BASE_URL}/focus-sessions`;
  return makeAuthRequest(url, {
    method: "POST",
    body: JSON.stringify({
      userId: user._id,
      startTime: new Date().toISOString(),
      source: "extension"
    })
  });
}

// End a focus session
async function endFocusSession(sessionId, distractionCount = 0) {
  const url = `${API_BASE_URL}/focus-sessions/${sessionId}/end`;
  return makeAuthRequest(url, {
    method: "POST",
    body: JSON.stringify({
      distractions: distractionCount
    })
  });
}

// Record usage metric
async function recordUsage(usageData) {
  const url = `${API_BASE_URL}/usage-metrics`;
  return makeAuthRequest(url, {
    method: "POST",
    body: JSON.stringify(usageData)
  });
}

// Get custom block page
async function getCustomBlockPage() {
  return new Promise((resolve, reject) => {
    getToken(async (token) => {
      if (!token) {
        reject(new Error("No authentication token found"));
        return;
      }

      try {
        // First get user info to get userId
        const user = await getCurrentUser();
        const url = `${API_BASE_URL}/custom-block-page/user/${user._id}`;
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        const data = await response.json();

        if (!response.ok) {
          reject(new Error(data.message || "Failed to fetch custom block page"));
          return;
        }

        resolve(data);
      } catch (error) {
        reject(error);
      }
    });
  });
}

// Get time limits for current user
async function getTimeLimits() {
  return new Promise((resolve, reject) => {
    getToken(async (token) => {
      if (!token) {
        reject(new Error("No authentication token found"));
        return;
      }

      try {
        const user = await getCurrentUser();
        const url = `${API_BASE_URL}/time-limits/user/${user._id}`;
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        const data = await response.json();

        if (!response.ok) {
          reject(new Error(data.message || "Failed to fetch time limits"));
          return;
        }

        resolve(data);
      } catch (error) {
        reject(error);
      }
    });
  });
}

// Get active schedules for current user
async function getActiveSchedules() {
  return new Promise((resolve, reject) => {
    getToken(async (token) => {
      if (!token) {
        reject(new Error("No authentication token found"));
        return;
      }

      try {
        const user = await getCurrentUser();
        const url = `${API_BASE_URL}/schedules/user/${user._id}/active`;
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        const data = await response.json();

        if (!response.ok) {
          reject(new Error(data.message || "Failed to fetch active schedules"));
          return;
        }

        resolve(data);
      } catch (error) {
        reject(error);
      }
    });
  });
}

// Update time used for a time limit
async function updateTimeUsed(timeLimitId, timeUsedSeconds) {
  return new Promise((resolve, reject) => {
    getToken(async (token) => {
      if (!token) {
        reject(new Error("No authentication token found"));
        return;
      }

      try {
        const url = `${API_BASE_URL}/time-limits/${timeLimitId}/time-used`;
        const response = await fetch(url, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ timeUsed: timeUsedSeconds })
        });

        const data = await response.json();

        if (!response.ok) {
          reject(new Error(data.message || "Failed to update time used"));
          return;
        }

        resolve(data);
      } catch (error) {
        reject(error);
      }
    });
  });
}
