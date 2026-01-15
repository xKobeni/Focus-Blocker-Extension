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

// Helper function to sync from backend (used by both message handler and periodic sync)
async function syncFromBackend(syncType = "all") {
  console.log(`🔄 Syncing from backend: ${syncType}`);
  
  if (syncType === "all" || syncType === "blockedSites") {
    await loadBlockedSites();
    updateBlockingState();
    console.log("✅ Blocked sites synced");
  }
  
  if (syncType === "all" || syncType === "customBlockPage") {
    await loadCustomBlockPage();
    if (isBlocking) {
      updateBlockingState();
    }
    console.log("✅ Custom block page synced");
  }
  
  if (syncType === "all" || syncType === "timeLimits") {
    if (self.timeLimitManager) {
      await self.timeLimitManager.loadTimeLimits();
      updateBlockingState();
      console.log("✅ Time limits synced");
    }
  }
  
  if (syncType === "all" || syncType === "schedules") {
    if (self.scheduleManager) {
      await self.scheduleManager.loadActiveSchedules();
      updateBlockingState();
      console.log("✅ Schedules synced");
    }
  }
  
  if (syncType === "all" || syncType === "focusSession") {
    // Check for active session from backend
    chrome.storage.local.get("token", async ({ token }) => {
      if (!token) return;
      
      try {
        const userResponse = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: { 
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });
        
        // Handle rate limiting on user fetch
        if (userResponse.status === 429) {
          console.warn("🔄 Rate limited when syncing focus session (user fetch), skipping");
          resolve();
          return;
        }
        
        if (userResponse.ok) {
          const user = await userResponse.json();
          const userId = user._id || user.id;
          
          if (!userId) {
            console.warn("⚠️ No user ID found when syncing focus session");
            resolve();
            return;
          }
          
          // Get active sessions
          const sessionsResponse = await fetch(`${API_BASE_URL}/focus-sessions/user/${userId}/active`, {
            headers: { 
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json"
            }
          });
          
          // Handle rate limiting
          if (sessionsResponse.status === 429) {
            console.warn("🔄 Rate limited when syncing focus session, will retry later");
            resolve();
            return;
          }
          
          if (sessionsResponse.ok) {
            const activeSessions = await sessionsResponse.json();
            if (activeSessions.length > 0) {
              const session = activeSessions[0];
              chrome.storage.local.set({ activeSessionId: session._id || session.id });
              console.log("✅ Active focus session synced:", session._id || session.id);
              
              // If session is active but blocking isn't, start blocking
              if (!isBlocking) {
                isBlocking = true;
                distractionCount = 0;
                await loadBlockedSites();
                updateBlockingState();
                checkAllOpenTabs();
              }
            } else {
              // No active session, clear it
              chrome.storage.local.remove("activeSessionId");
              console.log("✅ No active session found, cleared");
              
              // Stop blocking if no session
              if (isBlocking) {
                isBlocking = false;
                distractionCount = 0;
                updateBlockingState();
                
                if (self.timeLimitManager) {
                  self.timeLimitManager.stopTimeLimitChecking();
                }
                if (self.scheduleManager) {
                  self.scheduleManager.stopScheduleChecking();
                }
              }
            }
          }
        }
      } catch (error) {
        console.error("❌ Error syncing focus session:", error);
      }
    });
  }
}

// Periodic sync from backend (every 30 seconds)
// This ensures extension stays in sync with database even if notifications are missed
let syncInterval = null;

function startPeriodicSync() {
  // Clear existing interval if any
  if (syncInterval) {
    clearInterval(syncInterval);
  }
  
  // Sync every 120 seconds (2 minutes) to significantly reduce API calls and avoid rate limiting
  syncInterval = setInterval(() => {
    chrome.storage.local.get("token", ({ token }) => {
      if (token) {
        console.log("🔄 Periodic sync from backend...");
        // Call sync function directly (we're in background script)
        syncFromBackend("all").catch((error) => {
          // Don't log rate limiting errors as errors
          if (!error.message?.includes('429') && !error.message?.includes('Rate limited')) {
            console.error("❌ Periodic sync error:", error);
          }
        });
      }
    });
  }, 120000); // 120 seconds (2 minutes) - significantly reduced frequency
}

// Start periodic sync
startPeriodicSync();

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
  
  // CRITICAL: Only set isBlocking to true if we have blocked sites, time limits, or schedules
  const hasBlockedSites = blockedSites && blockedSites.length > 0;
  const hasTimeLimits = storageData.timeLimits && storageData.timeLimits.length > 0;
  const hasSchedules = storageData.activeSchedules && storageData.activeSchedules.length > 0;
  
  // Only enable blocking if we have something to block
  const shouldBeBlocking = isBlocking && (hasBlockedSites || hasTimeLimits || hasSchedules);
  
  console.log('📊 Updating blocking state:', {
    isBlocking: isBlocking,
    shouldBeBlocking: shouldBeBlocking,
    blockedSitesCount: blockedSites.length,
    hasTimeLimits: hasTimeLimits,
    hasSchedules: hasSchedules,
    hasActiveSession: !!sessionData.activeSessionId
  });
  
  await chrome.storage.local.set({
    isBlocking: shouldBeBlocking, // Use shouldBeBlocking instead of isBlocking
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
          isBlocking: shouldBeBlocking, // Use shouldBeBlocking
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
    loadBlockedSites().then(() => {
      // Only start blocking if we have blocked sites, time limits, or schedules
      const hasBlockedSites = blockedSites && blockedSites.length > 0;
      
      // Check for time limits and schedules
      chrome.storage.local.get(['timeLimits', 'activeSchedules'], (result) => {
        const hasTimeLimits = result.timeLimits && result.timeLimits.length > 0;
        const hasSchedules = result.activeSchedules && result.activeSchedules.length > 0;
        
        if (hasBlockedSites || hasTimeLimits || hasSchedules) {
          isBlocking = true;
          distractionCount = 0;
          console.log("🔥 Blocking started with", blockedSites.length, "blocked sites", 
                     hasTimeLimits ? `, ${result.timeLimits.length} time limits` : '',
                     hasSchedules ? `, ${result.activeSchedules.length} schedules` : '');
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
          
          // Immediately sync with backend to ensure we have the latest session
          setTimeout(() => {
            syncFromBackend("focusSession").catch(err => {
              console.debug("Session sync after start:", err.message);
            });
          }, 1000);
        } else {
          console.warn("⚠️ Cannot start blocking: No blocked sites, time limits, or schedules configured");
          isBlocking = false;
          updateBlockingState();
        }
      });
    });
    sendResponse({ status: "started" });
    return true;
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
    
    // Immediately sync with backend to ensure session is ended
    setTimeout(() => {
      syncFromBackend("focusSession").catch(err => {
        console.debug("Session sync after stop:", err.message);
      });
    }, 1000);
    
    sendResponse({ status: "stopped" });
    return true;
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
  } else if (message.action === "syncFromBackend") {
    // Sync data from backend (triggered by frontend changes or periodic sync)
    const syncType = message.syncType || "all";
    syncFromBackend(syncType).then(() => {
      sendResponse({ status: "synced" });
    }).catch((error) => {
      console.error("❌ Sync error:", error);
      sendResponse({ status: "error", error: error.message });
    });
    return true; // Keep channel open for async
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
          // Handle rate limiting
          if (userResponse.status === 429) {
            console.warn("📄 Rate limited when loading custom block page, skipping");
            resolve();
            return;
          }
          throw new Error("Failed to fetch user info");
        }

        const user = await userResponse.json();
        const userId = user._id || user.id;
        
        if (!userId) {
          console.warn("⚠️ No user ID found when loading custom block page");
          resolve();
          return;
        }

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
          // Handle rate limiting
          if (response.status === 429) {
            console.warn("📋 Rate limited when loading blocked sites, skipping");
            blockedSites = [];
            resolve();
            return;
          }
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
