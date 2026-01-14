// Schedule Manager - Checks and enforces schedules

let schedules = [];
let scheduleCheckInterval = null;

// Load active schedules from backend
async function loadActiveSchedules() {
  return new Promise((resolve) => {
    chrome.storage.local.get("token", async ({ token }) => {
      if (!token) {
        console.log("❌ No token found, cannot load schedules");
        schedules = [];
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

        // Get active schedules
        const response = await fetch(`${API_BASE_URL}/schedules/user/${userId}/active`, {
          headers: { 
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });

        if (response.ok) {
          const activeSchedules = await response.json();
          schedules = activeSchedules.filter(schedule => schedule.isActive !== false);
          await chrome.storage.local.set({ activeSchedules: schedules });
          console.log(`📅 Loaded ${schedules.length} active schedules`);
        } else {
          console.log("⚠️ No active schedules found");
          schedules = [];
        }
      } catch (error) {
        console.error("❌ Error loading schedules:", error);
        schedules = [];
      }
      resolve();
    });
  });
}

// Check if current time matches any active schedule
function checkActiveSchedule() {
  const now = new Date();
  const currentDay = now.getDay(); // 0 = Sunday, 6 = Saturday
  const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
  
  return schedules.filter(schedule => {
    // Check if today is in the schedule's days
    const matchesDay = schedule.daysOfWeek.includes(currentDay);
    
    if (!matchesDay) return false;
    
    // Check if current time is within schedule time range
    return currentTime >= schedule.startTime && currentTime <= schedule.endTime;
  });
}

// Check if a domain should be blocked based on active schedules
function shouldBlockBySchedule(domain) {
  const activeSchedules = checkActiveSchedule();
  
  if (activeSchedules.length === 0) return false;
  
  const cleanDomain = domain.replace(/^www\./, '').toLowerCase();
  
  for (const schedule of activeSchedules) {
    if (schedule.action === 'block_all') {
      return true; // Block all sites
    }
    
    if (schedule.action === 'block_categories' && schedule.categories) {
      // Check if domain matches any category (would need category mapping)
      // For now, if categories are specified, block
      return true;
    }
    
    if (schedule.action === 'block_sites' && schedule.siteIds) {
      // Check if domain is in the blocked sites list
      // This would require loading the sites from siteIds
      return true; // Simplified for now
    }
  }
  
  return false;
}

// Start checking schedules periodically
function startScheduleChecking() {
  if (scheduleCheckInterval) {
    clearInterval(scheduleCheckInterval);
  }
  
  // Check every minute
  scheduleCheckInterval = setInterval(() => {
    loadActiveSchedules().then(() => {
      // Notify all tabs about schedule changes
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach(tab => {
          if (tab.url && !tab.url.startsWith('chrome://') && !tab.url.startsWith('chrome-extension://')) {
            try {
              const url = new URL(tab.url);
              const domain = url.hostname;
              
              if (shouldBlockBySchedule(domain)) {
                chrome.tabs.sendMessage(tab.id, {
                  action: "scheduleActive",
                  schedules: checkActiveSchedule()
                }).catch(() => {
                  // Content script might not be loaded
                });
              }
            } catch (error) {
              // Invalid URL
            }
          }
        });
      });
    });
  }, 60000); // Check every minute
}

// Stop checking schedules
function stopScheduleChecking() {
  if (scheduleCheckInterval) {
    clearInterval(scheduleCheckInterval);
    scheduleCheckInterval = null;
  }
}

// Export functions
self.scheduleManager = {
  loadActiveSchedules,
  checkActiveSchedule,
  shouldBlockBySchedule,
  startScheduleChecking,
  stopScheduleChecking,
  getSchedules: () => schedules
};
