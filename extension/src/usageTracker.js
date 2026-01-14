// Usage Tracker - Tracks website visits and time spent
// Compatible with importScripts (non-module context)

// Ensure API_BASE_URL is available (from config.js)
if (typeof API_BASE_URL === 'undefined') {
  console.error('❌ API_BASE_URL not defined. Make sure config.js is loaded first.');
}

// Domain categorization
function categorizeDomain(domain) {
  const lowerDomain = domain.toLowerCase();
  
  // Social media
  if (lowerDomain.includes('facebook') || lowerDomain.includes('twitter') || 
      lowerDomain.includes('x.com') || lowerDomain.includes('instagram') || 
      lowerDomain.includes('linkedin') || lowerDomain.includes('reddit') ||
      lowerDomain.includes('tiktok') || lowerDomain.includes('snapchat') ||
      lowerDomain.includes('pinterest') || lowerDomain.includes('discord')) {
    return 'social';
  }
  
  // Video
  if (lowerDomain.includes('youtube') || lowerDomain.includes('vimeo') || 
      lowerDomain.includes('twitch') || lowerDomain.includes('dailymotion') ||
      lowerDomain.includes('netflix') || lowerDomain.includes('hulu') ||
      lowerDomain.includes('disney') || lowerDomain.includes('prime')) {
    return 'video';
  }
  
  // Gaming
  if (lowerDomain.includes('steam') || lowerDomain.includes('epic') ||
      lowerDomain.includes('roblox') || lowerDomain.includes('minecraft') ||
      lowerDomain.includes('game') || lowerDomain.includes('gaming')) {
    return 'gaming';
  }
  
  // News
  if (lowerDomain.includes('news') || lowerDomain.includes('cnn') ||
      lowerDomain.includes('bbc') || lowerDomain.includes('reuters') ||
      lowerDomain.includes('nytimes') || lowerDomain.includes('guardian')) {
    return 'news';
  }
  
  // Shopping
  if (lowerDomain.includes('amazon') || lowerDomain.includes('ebay') ||
      lowerDomain.includes('shop') || lowerDomain.includes('store') ||
      lowerDomain.includes('cart') || lowerDomain.includes('checkout')) {
    return 'shopping';
  }
  
  // Productivity (common productivity tools)
  if (lowerDomain.includes('google.com') || lowerDomain.includes('docs.google') ||
      lowerDomain.includes('drive.google') || lowerDomain.includes('notion') ||
      lowerDomain.includes('trello') || lowerDomain.includes('asana') ||
      lowerDomain.includes('slack') || lowerDomain.includes('github') ||
      lowerDomain.includes('stackoverflow') || lowerDomain.includes('medium')) {
    return 'productivity';
  }
  
  return 'other';
}

// Extract domain from URL
function extractDomain(url) {
  try {
    if (!url || url.startsWith('chrome://') || url.startsWith('chrome-extension://')) {
      return null;
    }
    const urlObj = new URL(url);
    return urlObj.hostname.replace(/^www\./, '');
  } catch (error) {
    return null;
  }
}

// Track active tab and time spent
class UsageTracker {
  constructor() {
    this.activeTab = null;
    this.activeDomain = null;
    this.startTime = null;
    this.trackingInterval = null;
    this.syncInterval = null;
    this.pendingUsage = new Map(); // domain -> { timeSpent, visitCount, url, category, isBlocked }
    this.isTrackingEnabled = true;
    this.isWindowFocused = true;
    this.lastActiveTime = null;
  }

  // Start tracking
  async start() {
    // Prevent multiple starts
    if (this.trackingInterval || this.syncInterval) {
      console.log('📊 Usage tracking already started');
      return;
    }
    
    console.log('📊 Starting usage tracking...');
    
    // Check if tracking is enabled (default to true)
    chrome.storage.local.get(['trackUsage'], (result) => {
      this.isTrackingEnabled = result.trackUsage !== false; // Default to true
      console.log(`📊 Tracking enabled: ${this.isTrackingEnabled}`);
    });

    // Track active tab changes
    chrome.tabs.onActivated.addListener((activeInfo) => {
      this.handleTabActivated(activeInfo.tabId);
    });

    // Track tab updates (URL changes)
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      // Track when URL changes (even if not complete yet)
      if (changeInfo.url && tab.active) {
        this.handleTabUpdated(tabId, tab.url);
      }
      // Also track when page completes loading
      if (changeInfo.status === 'complete' && tab.active && tab.url) {
        this.handleTabUpdated(tabId, tab.url);
      }
    });

    // Track when tabs are closed
    chrome.tabs.onRemoved.addListener((tabId) => {
      if (tabId === this.activeTab) {
        // Save time before tab closes
        if (this.startTime && this.activeDomain) {
          this.saveTabTime(tabId, this.activeDomain);
        }
        // Try to find new active tab
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0] && tabs[0].url) {
            this.startTracking(tabs[0].id, tabs[0].url);
          } else {
            this.activeTab = null;
            this.activeDomain = null;
            this.startTime = null;
            this.lastActiveTime = null;
          }
        });
      }
    });

    // Track window focus changes
    chrome.windows.onFocusChanged.addListener((windowId) => {
      if (windowId === chrome.windows.WINDOW_ID_NONE) {
        // Window lost focus
        this.pauseTracking();
      } else {
        // Window gained focus
        this.resumeTracking();
      }
    });

    // Start continuous time tracking interval (every 5 seconds)
    // This ensures we track time even when user stays on the same tab
    this.trackingInterval = setInterval(() => {
      this.updateActiveTabTime();
    }, 5000); // 5 seconds

    // Start periodic sync (every 30 seconds)
    this.syncInterval = setInterval(() => {
      this.syncUsageToBackend();
    }, 30000); // 30 seconds

    // Sync on startup
    this.syncUsageToBackend();

    // Initialize with current active tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0] && tabs[0].url) {
        this.startTracking(tabs[0].id, tabs[0].url);
        console.log(`📊 Started tracking: ${tabs[0].url}`);
      }
    });
    
    console.log('✅ Usage tracking fully initialized');
  }

  // Handle tab activation
  async handleTabActivated(tabId) {
    if (!this.isTrackingEnabled) return;
    
    // Save previous tab's time
    if (this.activeTab && this.startTime && this.activeDomain) {
      await this.saveTabTime(this.activeTab, this.activeDomain);
    }

    // Get new active tab
    try {
      const tab = await chrome.tabs.get(tabId);
      if (tab.url && !tab.url.startsWith('chrome://') && !tab.url.startsWith('chrome-extension://')) {
        this.startTracking(tabId, tab.url);
      }
    } catch (error) {
      // Tab might have been closed, ignore
      console.debug('Tab not available:', error);
    }
  }

  // Handle tab update
  async handleTabUpdated(tabId, url) {
    if (!this.isTrackingEnabled) return;
    
    if (tabId === this.activeTab) {
      // Same tab, check if URL/domain changed
      const newDomain = extractDomain(url);
      if (!newDomain) {
        // Invalid URL (chrome://, etc.), stop tracking
        this.activeTab = null;
        this.activeDomain = null;
        this.startTime = null;
        this.lastActiveTime = null;
        return;
      }
      
      if (newDomain !== this.activeDomain) {
        // Domain changed, save old domain time and start tracking new domain
        if (this.startTime && this.activeDomain) {
          await this.saveTabTime(tabId, this.activeDomain);
        }
        this.startTracking(tabId, url);
      }
      // If domain is the same, just continue tracking (no need to restart)
    } else if (!this.activeTab) {
      // No active tab being tracked, start tracking this one if it's active
      try {
        const tab = await chrome.tabs.get(tabId);
        if (tab.active) {
          this.startTracking(tabId, url);
        }
      } catch (error) {
        console.debug('Tab not available for update:', error);
      }
    }
  }

  // Start tracking a tab
  startTracking(tabId, url) {
    if (!this.isTrackingEnabled) {
      console.debug('📊 Tracking disabled, skipping');
      return;
    }

    const domain = extractDomain(url);
    if (!domain) {
      this.activeTab = null;
      this.activeDomain = null;
      this.startTime = null;
      this.lastActiveTime = null;
      return;
    }

    // Save previous tab if switching
    if (this.activeTab && this.activeTab !== tabId && this.startTime && this.activeDomain) {
      this.saveTabTime(this.activeTab, this.activeDomain);
    }

    this.activeTab = tabId;
    this.activeDomain = domain;
    this.startTime = Date.now();
    this.lastActiveTime = Date.now();

    // Check if domain is blocked
    chrome.storage.local.get(['blockedSites'], (result) => {
      const blockedSites = result.blockedSites || [];
      const isBlocked = blockedSites.some(blocked => {
        const cleanBlocked = blocked.replace(/^www\./, '');
        return domain.includes(cleanBlocked) || cleanBlocked.includes(domain);
      });

      // Record visit
      this.recordVisit(domain, url, isBlocked);
      console.log(`📊 Tracking: ${domain} (blocked: ${isBlocked})`);
      
      // Check time limits and update time used
      if (self.timeLimitManager) {
        const timeLimitInfo = self.timeLimitManager.checkTimeLimit(domain);
        if (timeLimitInfo && !timeLimitInfo.isExceeded) {
          // Update time used (will be synced to backend)
          // This happens in syncUsageToBackend
        }
      }
    });
  }

  // Update time spent on active tab periodically
  async updateActiveTabTime() {
    if (!this.isTrackingEnabled || !this.isWindowFocused) {
      return;
    }

    // Check if we have an active tab
    if (!this.activeTab || !this.activeDomain || !this.startTime) {
      // Try to get current active tab
      try {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tabs[0] && tabs[0].url) {
          const domain = extractDomain(tabs[0].url);
          if (domain) {
            // Check if tab changed
            if (tabs[0].id !== this.activeTab || domain !== this.activeDomain) {
              // Tab changed, save previous and start new
              if (this.activeTab && this.startTime && this.activeDomain) {
                await this.saveTabTime(this.activeTab, this.activeDomain);
              }
              this.startTracking(tabs[0].id, tabs[0].url);
            } else {
              // Same tab, just update startTime if needed
              if (!this.startTime) {
                this.startTime = Date.now();
                this.lastActiveTime = Date.now();
              }
            }
          }
        }
      } catch (error) {
        console.debug('Error checking active tab:', error);
      }
      return;
    }

    // Verify tab still exists and is active
    try {
      const tab = await chrome.tabs.get(this.activeTab);
      
      // Check if tab is still active
      if (!tab.active) {
        // Tab is not active, save time and clear tracking
        await this.saveTabTime(this.activeTab, this.activeDomain);
        this.activeTab = null;
        this.activeDomain = null;
        this.startTime = null;
        this.lastActiveTime = null;
        return;
      }

      // Check if URL changed
      const currentDomain = extractDomain(tab.url);
      if (currentDomain && currentDomain !== this.activeDomain) {
        // URL changed, save old domain time and start tracking new domain
        await this.saveTabTime(this.activeTab, this.activeDomain);
        this.startTracking(this.activeTab, tab.url);
        return;
      }

      // Tab is still active, update time spent periodically
      const now = Date.now();
      const timeSpent = Math.floor((now - this.startTime) / 1000); // seconds
      
      // Only save if at least 5 seconds have passed
      if (timeSpent >= 5 && this.lastActiveTime) {
        const elapsedSinceLastUpdate = Math.floor((now - this.lastActiveTime) / 1000);
        
        if (elapsedSinceLastUpdate >= 5) {
          // Update pending usage with accumulated time
          if (this.pendingUsage.has(this.activeDomain)) {
            const usage = this.pendingUsage.get(this.activeDomain);
            // Add the time since last update
            usage.timeSpent += elapsedSinceLastUpdate;
          } else {
            // Create new entry
            this.pendingUsage.set(this.activeDomain, {
              domain: this.activeDomain,
              url: tab.url || `https://${this.activeDomain}`,
              timeSpent: elapsedSinceLastUpdate,
              visitCount: 1,
              category: categorizeDomain(this.activeDomain),
              isBlocked: false
            });
          }
          
          // Reset start time to now to avoid double counting
          this.startTime = now;
          this.lastActiveTime = now;
          
          console.debug(`📊 Updated time for ${this.activeDomain}: +${elapsedSinceLastUpdate}s`);
        }
      } else {
        this.lastActiveTime = now;
      }
    } catch (error) {
      // Tab might have been closed
      console.debug('Tab not available for time update:', error);
      this.activeTab = null;
      this.activeDomain = null;
      this.startTime = null;
      this.lastActiveTime = null;
    }
  }

  // Record a visit
  recordVisit(domain, url, isBlocked) {
    if (!this.pendingUsage.has(domain)) {
      this.pendingUsage.set(domain, {
        domain,
        url,
        timeSpent: 0,
        visitCount: 0,
        category: categorizeDomain(domain),
        isBlocked: isBlocked || false
      });
    }

    const usage = this.pendingUsage.get(domain);
    usage.visitCount += 1;
    usage.isBlocked = isBlocked || usage.isBlocked;
    usage.url = url; // Update to latest URL
  }

  // Save time spent on a tab
  async saveTabTime(tabId, domain) {
    if (!this.startTime || !domain) return;
    
    // Only save if this is the currently tracked tab
    if (tabId !== this.activeTab && this.activeTab !== null) {
      return;
    }

    const now = Date.now();
    const timeSpent = Math.floor((now - this.startTime) / 1000); // Convert to seconds
    if (timeSpent < 1) return; // Ignore very short visits (< 1 second)

    // Get current URL if available
    let currentUrl = '';
    try {
      const tab = await chrome.tabs.get(tabId);
      currentUrl = tab.url || '';
    } catch (error) {
      // Tab might be closed, use domain as fallback
      currentUrl = `https://${domain}`;
    }

    if (this.pendingUsage.has(domain)) {
      const usage = this.pendingUsage.get(domain);
      usage.timeSpent += timeSpent;
      if (currentUrl) {
        usage.url = currentUrl; // Update to latest URL
      }
    } else {
      // Create new entry
      this.pendingUsage.set(domain, {
        domain,
        url: currentUrl || `https://${domain}`,
        timeSpent,
        visitCount: 1,
        category: categorizeDomain(domain),
        isBlocked: false
      });
    }

    // Reset tracking state
    this.startTime = null;
    this.lastActiveTime = null;
  }

  // Pause tracking (window lost focus)
  pauseTracking() {
    this.isWindowFocused = false;
    if (this.activeTab && this.startTime && this.activeDomain) {
      this.saveTabTime(this.activeTab, this.activeDomain);
    }
  }

  // Resume tracking (window gained focus)
  resumeTracking() {
    this.isWindowFocused = true;
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0] && tabs[0].url) {
        this.startTracking(tabs[0].id, tabs[0].url);
      }
    });
  }

  // Get userId from backend
  async getUserId() {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get(['token', 'userId'], async (result) => {
        // If we already have userId cached, use it
        if (result.userId) {
          resolve(result.userId);
          return;
        }

        // Otherwise, fetch from backend
        if (!result.token) {
          reject(new Error('No token found'));
          return;
        }

        try {
          const response = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: {
              'Authorization': `Bearer ${result.token}`,
              'Content-Type': 'application/json'
            }
          });

          if (!response.ok) {
            throw new Error('Failed to get user info');
          }

          const user = await response.json();
          const userId = user._id || user.id;

          // Cache userId for future use
          if (userId) {
            chrome.storage.local.set({ userId });
          }

          resolve(userId);
        } catch (error) {
          console.error('Error getting userId:', error);
          reject(error);
        }
      });
    });
  }

  // Sync usage data to backend and update time limits
  async syncUsageToBackend() {
    if (this.pendingUsage.size === 0) return;

    // Save current active tab time before syncing
    if (this.activeTab && this.startTime) {
      await this.saveTabTime(this.activeTab, this.activeDomain);
    }

    chrome.storage.local.get(['token', 'timeLimits'], async (result) => {
      if (!result.token) {
        console.log('📊 No token, skipping usage sync');
        return;
      }

      try {
        // Get userId
        const userId = await this.getUserId();
        if (!userId) {
          console.log('📊 No userId, skipping usage sync');
          return;
        }

        const usageArray = Array.from(this.pendingUsage.values());
        if (usageArray.length === 0) return;

        console.log(`📊 Syncing ${usageArray.length} usage records to backend`);

        // Send each usage record and update time limits
        for (const usage of usageArray) {
        try {
          if (typeof API_BASE_URL === 'undefined') {
            console.error('❌ API_BASE_URL not defined');
            return;
          }

          // Sync usage metric
          const response = await fetch(`${API_BASE_URL}/usage-metrics`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${result.token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              userId: userId,
              domain: usage.domain,
              url: usage.url || `https://${usage.domain}`,
              timeSpent: usage.timeSpent,
              category: usage.category,
              isBlocked: usage.isBlocked
            })
          });

          if (response.ok) {
            console.log(`✅ Synced usage for ${usage.domain} (${usage.timeSpent}s, ${usage.visitCount} visits)`);
            
            // Update time limit if this domain has one
            if (result.timeLimits && result.timeLimits.length > 0) {
              const timeLimit = result.timeLimits.find(limit => {
                const limitDomain = limit.domain.replace(/^www\./, '').toLowerCase();
                const cleanDomain = usage.domain.replace(/^www\./, '').toLowerCase();
                return cleanDomain === limitDomain || 
                       cleanDomain.endsWith('.' + limitDomain) ||
                       limitDomain.endsWith('.' + cleanDomain);
              });
              
              if (timeLimit && timeLimit._id) {
                try {
                  // Update time used for this time limit
                  const timeLimitResponse = await fetch(`${API_BASE_URL}/time-limits/${timeLimit._id}/time-used`, {
                    method: 'PUT',
                    headers: {
                      'Authorization': `Bearer ${result.token}`,
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ timeUsed: usage.timeSpent })
                  });
                  
                  if (timeLimitResponse.ok) {
                    const updatedLimit = await timeLimitResponse.json();
                    console.log(`⏱️ Updated time limit for ${usage.domain}: ${Math.round(updatedLimit.timeUsedToday / 60)}/${updatedLimit.dailyLimitMinutes} minutes`);
                    
                    // Update local storage
                    const updatedLimits = result.timeLimits.map(limit => 
                      limit._id === timeLimit._id ? updatedLimit : limit
                    );
                    chrome.storage.local.set({ timeLimits: updatedLimits });
                    
                    // Reload time limits in manager if available
                    if (self.timeLimitManager) {
                      await self.timeLimitManager.loadTimeLimits();
                    }
                  }
                } catch (error) {
                  console.error(`❌ Error updating time limit for ${usage.domain}:`, error);
                }
              }
            }
          } else {
            const error = await response.json().catch(() => ({}));
            console.error(`❌ Failed to sync usage for ${usage.domain}:`, error.message || 'Unknown error');
          }
        } catch (error) {
          console.error(`❌ Error syncing usage for ${usage.domain}:`, error.message || error);
        }
        }

        // Clear pending usage after successful sync
        this.pendingUsage.clear();
      } catch (error) {
        console.error('📊 Error getting userId for usage sync:', error);
      }
    });
  }

  // Stop tracking
  stop() {
    if (this.trackingInterval) {
      clearInterval(this.trackingInterval);
      this.trackingInterval = null;
    }
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    // Save current tab time before stopping
    if (this.activeTab && this.startTime && this.activeDomain) {
      this.saveTabTime(this.activeTab, this.activeDomain);
    }
    // Final sync before stopping
    this.syncUsageToBackend();
  }
}

// Create and export singleton instance
const usageTracker = new UsageTracker();

// Make it globally available
self.usageTracker = usageTracker;

// Auto-start tracking when script loads
console.log('📊 Usage tracker module loaded');
