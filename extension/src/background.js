importScripts('config.js', 'utils.js');
importScripts('usageTracker.js');
importScripts('timeLimitManager.js');
importScripts('scheduleManager.js');

let blockedSites = [];
let isBlocking = false;
let distractionCount = 0;

// Initialize usage tracking automatically
function initializeUsageTracking() {
  // Wait a bit for usageTracker to be available
  setTimeout(() => {
    if (self.usageTracker) {
      try {
        self.usageTracker.start();
        console.log('✅ Usage tracker started automatically');
      } catch (error) {
        console.error('❌ Failed to start usage tracker:', error);
      }
    } else {
      console.error('❌ Usage tracker not found');
    }
  }, 100);
}

// Start usage tracking immediately
initializeUsageTracking();

chrome.runtime.onInstalled.addListener(() => {
  console.log("🎯 Focus Blocker Installed");
  loadBlockedSites(); // This also loads custom block page
  checkForActiveSession();
  
  // Ensure usage tracking is running
  initializeUsageTracking();
});

// Also start on extension startup (not just install)
chrome.runtime.onStartup.addListener(() => {
  console.log("🔄 Extension started");
  initializeUsageTracking();
});

// Check if there's an active session on startup
async function checkForActiveSession() {
  chrome.storage.local.get(['activeSessionId'], async (result) => {
    if (result.activeSessionId) {
      console.log("🔄 Found active session on startup, enabling blocking");
      isBlocking = true;
      distractionCount = 0;
      await loadBlockedSites(); // This also loads custom block page, time limits, and schedules
      await updateBlockingState();
      checkAllOpenTabs();
      
      // Start time limit and schedule checking
      setTimeout(() => {
        if (self.timeLimitManager) {
          self.timeLimitManager.startTimeLimitChecking();
        }
        if (self.scheduleManager) {
          self.scheduleManager.startScheduleChecking();
        }
      }, 2000); // Wait a bit for managers to load
    } else {
      // Load custom block page, time limits, and schedules even if no active session
      await loadCustomBlockPage();
      setTimeout(async () => {
        if (self.timeLimitManager) {
          await self.timeLimitManager.loadTimeLimits();
        }
        if (self.scheduleManager) {
          await self.scheduleManager.loadActiveSchedules();
        }
      }, 1000);
    }
  });
}

// Also check when extension starts (not just on install)
checkForActiveSession();

// Store blocking state in chrome.storage for content scripts
async function updateBlockingState() {
  // Reload custom block page before updating state
  await loadCustomBlockPage();
  
  // Reload time limits and schedules if managers are available
  if (self.timeLimitManager) {
    await self.timeLimitManager.loadTimeLimits();
  }
  if (self.scheduleManager) {
    await self.scheduleManager.loadActiveSchedules();
  }
  
  // Get all relevant data to send to content scripts
  const storageData = await new Promise((resolve) => {
    chrome.storage.local.get(['customBlockPage', 'timeLimits', 'activeSchedules'], (data) => {
      resolve(data);
    });
  });
  
  // Get activeSessionId to include in message
  const sessionData = await new Promise((resolve) => {
    chrome.storage.local.get(['activeSessionId'], (data) => {
      resolve(data);
    });
  });
  
  await chrome.storage.local.set({
    isBlocking: isBlocking,
    blockedSites: blockedSites,
    customBlockPage: storageData.customBlockPage || null,
    timeLimits: storageData.timeLimits || [],
    activeSchedules: storageData.activeSchedules || []
  });
  
  // Notify all content scripts about the state change
  const tabs = await chrome.tabs.query({});
  for (const tab of tabs) {
    if (tab.url && !tab.url.startsWith('chrome://') && !tab.url.startsWith('chrome-extension://')) {
      try {
        await chrome.tabs.sendMessage(tab.id, {
          action: "updateBlockingState",
          isBlocking: isBlocking,
          activeSessionId: sessionData.activeSessionId || null, // Include session ID
          blockedSites: blockedSites,
          customBlockPage: storageData.customBlockPage || null,
          timeLimits: storageData.timeLimits || [],
          activeSchedules: storageData.activeSchedules || []
        });
      } catch (error) {
        // Content script might not be loaded yet, ignore
      }
    }
  }
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "startBlocking") {
    isBlocking = true;
    distractionCount = 0;
    loadBlockedSites().then(() => {
      console.log("🔥 Blocking started with", blockedSites.length, "sites");
      updateBlockingState();
      // Check all currently open tabs
      checkAllOpenTabs();
      
      // Start time limit and schedule checking
      setTimeout(() => {
        if (self.timeLimitManager) {
          self.timeLimitManager.startTimeLimitChecking();
          console.log('⏱️ Time limit checking started');
        }
        if (self.scheduleManager) {
          self.scheduleManager.startScheduleChecking();
          console.log('📅 Schedule checking started');
        }
      }, 2000); // Wait a bit for managers to load
    });
  } else if (message.action === "stopBlocking") {
    isBlocking = false;
    distractionCount = 0;
    console.log("✅ Blocking stopped");
    updateBlockingState();
    
    // Stop time limit and schedule checking
    if (self.timeLimitManager) {
      self.timeLimitManager.stopTimeLimitChecking();
    }
    if (self.scheduleManager) {
      self.scheduleManager.stopScheduleChecking();
    }
  } else if (message.action === "getDistractionCount") {
    sendResponse({ count: distractionCount });
  } else if (message.action === "reloadBlockedSites") {
    loadBlockedSites().then(() => {
      updateBlockingState();
    });
  } else if (message.action === "reloadCustomBlockPage") {
    loadCustomBlockPage().then(() => {
      console.log("✅ Custom block page reloaded");
      // Notify content scripts to update overlay if blocking is active
      if (isBlocking) {
        updateBlockingState();
      }
      sendResponse({ status: "reloaded" });
    });
  } else if (message.action === "reloadTimeLimits") {
    if (self.timeLimitManager) {
      self.timeLimitManager.loadTimeLimits().then(() => {
        // Update blocking state to notify content scripts
        updateBlockingState();
        sendResponse({ status: "reloaded" });
      });
    }
  } else if (message.action === "reloadSchedules") {
    if (self.scheduleManager) {
      self.scheduleManager.loadActiveSchedules().then(() => {
        // Update blocking state to notify content scripts
        updateBlockingState();
        sendResponse({ status: "reloaded" });
      });
    }
  } else if (message.action === "reloadAll") {
    // Reload everything (blocked sites, time limits, schedules, custom block page)
    loadBlockedSites().then(() => {
      updateBlockingState();
      sendResponse({ status: "reloaded" });
    });
  }
  return true; // Keep message channel open for async response
});

// Check all currently open tabs when blocking starts
async function checkAllOpenTabs() {
  if (!isBlocking) return;
  
  const tabs = await chrome.tabs.query({});
  for (const tab of tabs) {
    if (tab.url && !tab.url.startsWith('chrome://') && !tab.url.startsWith('chrome-extension://')) {
      checkAndBlockTab(tab.id, tab.url);
    }
  }
}

// Intercept tab updates and block distracting sites
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (!isBlocking || !tab.url) return;
  
  // Only check when page completes loading
  if (changeInfo.status === 'complete') {
    checkAndBlockTab(tabId, tab.url);
    
    // Also notify content script to check
    try {
      await chrome.tabs.sendMessage(tabId, {
        action: "checkBlocking"
      });
    } catch (error) {
      // Content script might not be loaded yet, that's okay
    }
  }
});

// Also check when tabs are activated (switched to)
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  if (!isBlocking) return;
  
  const tab = await chrome.tabs.get(activeInfo.tabId);
  if (tab.url) {
    checkAndBlockTab(activeInfo.tabId, tab.url);
    
    // Notify content script to check
    try {
      await chrome.tabs.sendMessage(activeInfo.tabId, {
        action: "checkBlocking"
      });
    } catch (error) {
      // Content script might not be loaded yet, that's okay
    }
  }
});

// Helper function to check if domain is blocked (improved matching)
function isDomainBlocked(domain) {
  if (!blockedSites || blockedSites.length === 0) return false;
  
  const cleanDomain = domain.replace(/^www\./, '').toLowerCase();
  
  return blockedSites.some(blocked => {
    const cleanBlocked = blocked.replace(/^www\./, '').toLowerCase();
    // Exact match or domain ends with blocked domain (e.g., facebook.com matches m.facebook.com)
    return cleanDomain === cleanBlocked || 
           cleanDomain.endsWith('.' + cleanBlocked) ||
           cleanBlocked.endsWith('.' + cleanDomain);
  });
}

// Function to check if a URL should be blocked
function checkAndBlockTab(tabId, url) {
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname;
    
    // Check if site is blocked using improved matching
    const isBlocked = isDomainBlocked(domain);
    
    if (isBlocked) {
      distractionCount++;
      console.log(`🚫 Blocked: ${domain} (Total distractions: ${distractionCount})`);
      
      // Notify content script to inject overlay
      chrome.tabs.sendMessage(tabId, {
        action: "checkBlocking"
      }).catch(() => {
        // Content script might not be loaded yet, that's okay
        // It will check when it loads
      });
    }
  } catch (error) {
    // Ignore chrome:// and other non-http URLs
    if (!url.startsWith('chrome://') && !url.startsWith('chrome-extension://')) {
      console.error("Error checking URL:", error);
    }
  }
}

// Load custom block page from backend
async function loadCustomBlockPage() {
  return new Promise((resolve) => {
    chrome.storage.local.get("token", async ({ token }) => {
      if (!token) {
        console.log("❌ No token found, cannot load custom block page");
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

        // Get custom block page - try /me endpoint first (uses authenticated user)
        let response = await fetch(`${API_BASE_URL}/custom-block-page/me`, {
          headers: { 
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });
        
        // Fallback to user/:userId if /me doesn't work
        if (!response.ok) {
          console.log('⚠️ /me endpoint failed, trying /user/:userId');
          response = await fetch(`${API_BASE_URL}/custom-block-page/user/${userId}`, {
            headers: { 
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json"
            }
          });
        }

        if (response.ok) {
          const blockPage = await response.json();
          console.log("📄 Custom block page response:", blockPage);
          
          // Only store if isActive is true
          if (blockPage.isActive !== false) {
            // Store in chrome.storage for content scripts
            await chrome.storage.local.set({ customBlockPage: blockPage });
            console.log("✅ Custom block page loaded and stored:", {
              title: blockPage.title,
              message: blockPage.message?.substring(0, 50) + '...',
              iconType: blockPage.iconType,
              hasIcon: !!(blockPage.icon || blockPage.iconUrl),
              backgroundColor: blockPage.backgroundColor?.substring(0, 50) + '...',
              textColor: blockPage.textColor
            });
          } else {
            console.log("⚠️ Custom block page is inactive, using defaults");
            await chrome.storage.local.set({ customBlockPage: null });
          }
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.log("⚠️ Failed to load custom block page:", response.status, errorData.message || 'Unknown error');
          await chrome.storage.local.set({ customBlockPage: null });
        }
      } catch (error) {
        console.error("❌ Error loading custom block page:", error);
        // Don't clear existing data on error, might be temporary network issue
      }
      resolve();
    });
  });
}

// Load blocked sites from backend
async function loadBlockedSites() {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get("token", async ({ token }) => {
      if (!token) {
        console.log("❌ No token found, cannot load blocked sites");
        blockedSites = [];
        resolve();
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/blocked-sites`, {
          headers: { 
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });

        if (!response.ok) {
          throw new Error("Failed to fetch blocked sites");
        }

        const sites = await response.json();
        
        // Filter only active sites and extract domains from URLs
        blockedSites = sites
          .filter(site => site.isActive !== false) // Only active sites
          .map(site => {
            try {
              // Try to parse as full URL
              const urlObj = new URL(site.url.startsWith('http') ? site.url : `https://${site.url}`);
              return urlObj.hostname.replace(/^www\./, '');
            } catch {
              // If parsing fails, treat as domain and remove www.
              return site.url.replace(/^www\./, '');
            }
          });

        console.log(`📋 Loaded ${blockedSites.length} blocked sites:`, blockedSites);
        
        // Update storage for content scripts
        await chrome.storage.local.set({ blockedSites: blockedSites });
        
        // Also load custom block page, time limits, and schedules
        await loadCustomBlockPage();
        if (self.timeLimitManager) {
          await self.timeLimitManager.loadTimeLimits();
        }
        if (self.scheduleManager) {
          await self.scheduleManager.loadActiveSchedules();
        }
        
        resolve();
      } catch (error) {
        console.error("❌ Error loading blocked sites:", error);
        blockedSites = [];
        reject(error);
      }
    });
  });
}
