// Time Limit Manager - Checks and enforces time limits

let timeLimits = [];
let timeLimitCheckInterval = null;

// Load time limits from backend
async function loadTimeLimits() {
  return new Promise((resolve) => {
    chrome.storage.local.get("token", async ({ token }) => {
      if (!token) {
        console.log("❌ No token found, cannot load time limits");
        timeLimits = [];
        resolve();
        return;
      }

      try {
        // Get user info first
        const userResponse = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: { 
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });

        if (!userResponse.ok) {
          throw new Error("Failed to fetch user info");
        }

        const user = await userResponse.json();
        const userId = user._id || user.id;

        // Get time limits
        const response = await fetch(`${API_BASE_URL}/time-limits/user/${userId}`, {
          headers: { 
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });

        if (response.ok) {
          const limits = await response.json();
          timeLimits = limits.filter(limit => limit.isActive !== false);
          await chrome.storage.local.set({ timeLimits: timeLimits });
          console.log(`⏱️ Loaded ${timeLimits.length} time limits`);
        } else {
          console.log("⚠️ No time limits found");
          timeLimits = [];
        }
      } catch (error) {
        console.error("❌ Error loading time limits:", error);
        timeLimits = [];
      }
      resolve();
    });
  });
}

// Check if domain has time limit and if it's exceeded
function checkTimeLimit(domain) {
  const cleanDomain = domain.replace(/^www\./, '').toLowerCase();
  
  const limit = timeLimits.find(limit => {
    const limitDomain = limit.domain.replace(/^www\./, '').toLowerCase();
    return cleanDomain === limitDomain || 
           cleanDomain.endsWith('.' + limitDomain) ||
           limitDomain.endsWith('.' + cleanDomain);
  });
  
  if (!limit) return null;
  
  const timeUsedMinutes = limit.timeUsedToday / 60;
  const limitMinutes = limit.dailyLimitMinutes;
  const isExceeded = timeUsedMinutes >= limitMinutes;
  
  return {
    limit,
    timeUsedMinutes,
    limitMinutes,
    remainingMinutes: Math.max(0, limitMinutes - timeUsedMinutes),
    isExceeded,
    action: limit.action || 'block'
  };
}

// Start checking time limits periodically
function startTimeLimitChecking() {
  if (timeLimitCheckInterval) {
    clearInterval(timeLimitCheckInterval);
  }
  
  // Check every 30 seconds
  timeLimitCheckInterval = setInterval(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0] && tabs[0].url) {
        try {
          const url = new URL(tabs[0].url);
          const domain = url.hostname;
          const timeLimitInfo = checkTimeLimit(domain);
          
          if (timeLimitInfo && timeLimitInfo.isExceeded) {
            // Notify content script to show overlay
            chrome.tabs.sendMessage(tabs[0].id, {
              action: "timeLimitExceeded",
              timeLimitInfo
            }).catch(() => {
              // Content script might not be loaded
            });
          }
        } catch (error) {
          // Invalid URL
        }
      }
    });
  }, 30000); // Check every 30 seconds
}

// Stop checking time limits
function stopTimeLimitChecking() {
  if (timeLimitCheckInterval) {
    clearInterval(timeLimitCheckInterval);
    timeLimitCheckInterval = null;
  }
}

// Export functions
self.timeLimitManager = {
  loadTimeLimits,
  checkTimeLimit,
  startTimeLimitChecking,
  stopTimeLimitChecking,
  getTimeLimits: () => timeLimits
};
