const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const loadingSection = document.getElementById("loading");
const authSection = document.getElementById("auth");
const controls = document.getElementById("controls");
const statusText = document.getElementById("status");
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const userName = document.getElementById("userName");

let currentSessionId = null;

// Show loading state
function showLoading() {
  loadingSection.style.display = "block";
  authSection.style.display = "none";
  controls.style.display = "none";
}

// Hide loading state
function hideLoading() {
  loadingSection.style.display = "none";
}

// Initialize popup
async function initializePopup() {
  showLoading();
  
  getToken(async (token) => {
    if (token) {
      try {
        // Verify token is still valid
        const user = await getCurrentUser();
        hideLoading();
        showControls(user.name || user.email);
      } catch (error) {
        console.error("Token verification failed:", error);
        clearToken();
        // Try to get token from frontend before showing auth
        await requestTokenFromFrontend();
      }
    } else {
      // No token in extension, try to get it from frontend
      await requestTokenFromFrontend();
    }
  });
}

// Request token from frontend if user is already logged in there
async function requestTokenFromFrontend() {
  console.log("🔍 Checking if frontend has token...");
  
  try {
    // Query for the frontend tab
    const tabs = await chrome.tabs.query({ url: `${FRONTEND_URL}/*` });
    
    if (tabs.length > 0) {
      // Frontend is open, request token from it
      console.log("📡 Frontend tab found, requesting token...");
      
      // Send message to content script on frontend tab
      chrome.tabs.sendMessage(
        tabs[0].id,
        { action: "requestTokenFromFrontend" },
        () => {
          // If there's no content script in that tab, Chrome will set lastError
          if (chrome.runtime.lastError) {
            console.warn(
              "⚠️ Could not reach content script in frontend tab:",
              chrome.runtime.lastError.message
            );
            // Fall back to showing auth UI
            hideLoading();
            showAuth();
            return;
          }

          // Wait a bit for the token to arrive in extension storage
          // Try multiple times with increasing delays (more attempts for reliability)
          let attempts = 0;
          const maxAttempts = 6; // Increased from 3 to 6
          
          const checkForToken = () => {
            attempts++;
            console.log(`🔍 Checking for token (attempt ${attempts}/${maxAttempts})...`);
            getToken(async (token) => {
              if (token) {
                try {
                  const user = await getCurrentUser();
                  hideLoading();
                  showControls(user.name || user.email);
                  console.log("✅ Successfully synced with frontend!");
                } catch (error) {
                  console.error("Token verification failed:", error);
                  hideLoading();
                  showAuth();
                }
              } else if (attempts < maxAttempts) {
                // Retry after a delay (longer delays for later attempts)
                const delay = attempts < 3 ? 500 * attempts : 1000 * (attempts - 2);
                console.log(`⏳ No token yet, retrying in ${delay}ms...`);
                setTimeout(checkForToken, delay);
              } else {
                console.log("❌ No token received from frontend after", maxAttempts, "attempts");
                console.log("💡 Tip: Make sure you're logged in on the frontend and the page is loaded");
                hideLoading();
                showAuth();
              }
            });
          };
          
          // Start checking after initial delay
          setTimeout(checkForToken, 300);
        }
      );
    } else {
      console.log("ℹ️ Frontend not open, showing login");
      showAuth();
    }
  } catch (error) {
    console.error("Error requesting token from frontend:", error);
    showAuth();
  }
}

// Listen for token updates from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "tokenUpdated" && message.token) {
    console.log("🔄 Token updated, refreshing popup...");
    initializePopup();
  }
});

// Listen for storage changes (session started/ended from web)
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && changes.activeSessionId) {
    const newSessionId = changes.activeSessionId.newValue;
    const oldSessionId = changes.activeSessionId.oldValue;
    
    console.log('🔄 Session storage changed:', { oldSessionId, newSessionId });
    
    if (newSessionId && !oldSessionId) {
      // Session started
      currentSessionId = newSessionId;
      updateSessionStatus(true);
      console.log('✅ Session started (detected from storage):', newSessionId);
    } else if (!newSessionId && oldSessionId) {
      // Session ended
      currentSessionId = null;
      updateSessionStatus(false);
      loadGamificationStats(); // Refresh stats
      console.log('✅ Session ended (detected from storage)');
    } else if (newSessionId !== oldSessionId) {
      // Session changed
      currentSessionId = newSessionId;
      updateSessionStatus(!!newSessionId);
      console.log('🔄 Session changed (detected from storage):', newSessionId);
    }
  }
});

// Show authentication section
function showAuth() {
  hideLoading();
  authSection.style.display = "flex";
  controls.style.display = "none";
}

// Show controls section
async function showControls(name) {
  hideLoading();
  authSection.style.display = "none";
  controls.style.display = "flex";
  userName.textContent = name;
  
  // Load user gamification stats
  await loadGamificationStats();
  
  // Check for active session from backend (most reliable source)
  await checkActiveSessionFromBackend();
}

// Update session status display
function updateSessionStatus(isActive) {
  const statusIndicator = document.querySelector(".status-indicator");
  
  if (isActive) {
    statusText.textContent = "🔥 Focus Session Active";
    statusText.classList.add("active");
    if (statusIndicator) {
      statusIndicator.style.background = "linear-gradient(90deg, #4CAF50, #81C784)";
    }
    startBtn.style.display = "none";
    stopBtn.style.display = "flex";
  } else {
    statusText.textContent = "Ready to Focus";
    statusText.classList.remove("active");
    if (statusIndicator) {
      statusIndicator.style.background = "rgba(255, 255, 255, 0.3)";
    }
    startBtn.style.display = "flex";
    stopBtn.style.display = "none";
  }
}

// Check for active session from backend
async function checkActiveSessionFromBackend() {
  try {
    const user = await getCurrentUser();
    const userId = user._id || user.id;
    
    if (!userId) {
      console.warn("No user ID found");
      updateSessionStatus(false);
      return;
    }
    
    // Get active sessions from backend
    const activeSessions = await getActiveFocusSessions(userId);
    
    if (activeSessions && activeSessions.length > 0) {
      const session = activeSessions[0];
      currentSessionId = session._id || session.id;
      
      // Store in chrome.storage for background script
      chrome.storage.local.set({ activeSessionId: currentSessionId }, () => {
        console.log("✅ Active session found from backend:", currentSessionId);
        updateSessionStatus(true);
        
        // Notify background script to start blocking if not already
        chrome.runtime.sendMessage({ action: "startBlocking" });
      });
    } else {
      // No active session found
      currentSessionId = null;
      chrome.storage.local.remove("activeSessionId", () => {
        console.log("ℹ️ No active session found in backend");
        updateSessionStatus(false);
      });
    }
  } catch (error) {
    console.error("Failed to check active session:", error);
    // Fallback to local storage
    chrome.storage.local.get("activeSessionId", (result) => {
      if (result.activeSessionId) {
        currentSessionId = result.activeSessionId;
        updateSessionStatus(true);
      } else {
        updateSessionStatus(false);
      }
    });
  }
}

// Load and display user gamification stats
async function loadGamificationStats() {
  try {
    const user = await getCurrentUser();
    
    // Update gamification display
    const levelElement = document.getElementById("userLevel");
    const xpElement = document.getElementById("userXP");
    const streakElement = document.getElementById("userStreak");
    
    if (levelElement) levelElement.textContent = user.level || 1;
    if (xpElement) xpElement.textContent = user.xp || 0;
    if (streakElement) streakElement.textContent = user.streak || 0;
    
    console.log("✨ Gamification stats loaded:", { 
      level: user.level, 
      xp: user.xp, 
      streak: user.streak 
    });
  } catch (error) {
    console.error("Failed to load gamification stats:", error);
  }
}

// Login opens web page
loginBtn.onclick = () => {
  // Option 1: Open frontend directly in new tab (default)
  chrome.tabs.create({ url: FRONTEND_URL + "/login" });
  
  // Option 2: Open frontend in extension viewer page (uncomment to use)
  // const viewerUrl = chrome.runtime.getURL(`pages/frontend-viewer.html?route=/login`);
  // chrome.tabs.create({ url: viewerUrl });
};

// Logout
logoutBtn.onclick = () => {
  if (currentSessionId) {
    if (!confirm("You have an active focus session. Are you sure you want to logout?")) {
      return;
    }
  }
  
  clearToken();
  chrome.storage.local.remove("activeSessionId");
  currentSessionId = null;
  showAuth();
  // Notify background script to stop blocking
  chrome.runtime.sendMessage({ action: "stopBlocking" });
};

// Helper function to get active sessions from backend
async function getActiveFocusSessions(userId) {
  return new Promise((resolve, reject) => {
    getToken(async (token) => {
      if (!token) {
        reject(new Error("No authentication token"));
        return;
      }
      
      try {
        const response = await fetch(`${API_BASE_URL}/focus-sessions/user/${userId}/active`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });
        
        if (!response.ok) {
          throw new Error("Failed to fetch active sessions");
        }
        
        const sessions = await response.json();
        resolve(sessions);
      } catch (error) {
        reject(error);
      }
    });
  });
}

// Start Focus Session
startBtn.onclick = async () => {
  try {
    statusText.textContent = "⏳ Starting session...";
    const session = await createFocusSession();
    currentSessionId = session._id || session.id;
    
    // Store active session ID
    chrome.storage.local.set({ activeSessionId: currentSessionId });
    
    updateSessionStatus(true);
    
    // Notify background script to start blocking
    chrome.runtime.sendMessage({ action: "startBlocking" });
    
    // Notify web frontend about session start (if open)
    notifyWebFrontend("SESSION_STARTED", { sessionId: currentSessionId });
    
  } catch (error) {
    console.error("Failed to start focus session:", error);
    statusText.textContent = "❌ Failed to start";
    setTimeout(() => updateSessionStatus(false), 2000);
    alert("Failed to start focus session: " + error.message);
  }
};

// Helper function to notify web frontend about session changes
function notifyWebFrontend(action, data = {}) {
  // Query for frontend tabs and send message
  chrome.tabs.query({ url: `${FRONTEND_URL}/*` }, (tabs) => {
    if (tabs && tabs.length > 0) {
      tabs.forEach((tab) => {
        chrome.tabs.sendMessage(tab.id, {
          action: "extensionSessionUpdate",
          type: action,
          ...data
        }, () => {
          if (chrome.runtime.lastError) {
            console.debug("Could not notify frontend tab:", chrome.runtime.lastError.message);
          } else {
            console.log(`✅ Notified frontend about ${action}`);
          }
        });
      });
    }
  });
}

// Stop Focus Session
stopBtn.onclick = async () => {
  if (!currentSessionId) {
    alert("No active session found");
    return;
  }

  try {
    statusText.textContent = "⏳ Ending session...";
    
    // Get distraction count from background script
    chrome.runtime.sendMessage({ action: "getDistractionCount" }, async (response) => {
      const distractionCount = response?.count || 0;
      
      await endFocusSession(currentSessionId, distractionCount);
      
      // Clear active session
      chrome.storage.local.remove("activeSessionId");
      currentSessionId = null;
      
      // Show success message briefly
      statusText.textContent = "✅ Session completed!";
      
      setTimeout(() => {
        updateSessionStatus(false);
      }, 1500);
      
      // Reload gamification stats (XP, level, streak updated)
      await loadGamificationStats();
      
      // Notify background script to stop blocking
      chrome.runtime.sendMessage({ action: "stopBlocking" });
      
      // Notify web frontend about session end
      notifyWebFrontend("SESSION_ENDED");
    });
    
  } catch (error) {
    console.error("Failed to end focus session:", error);
    statusText.textContent = "❌ Failed to end";
    setTimeout(() => updateSessionStatus(true), 2000);
    alert("Failed to end focus session: " + error.message);
  }
};

// Periodically check session status to keep in sync with backend
let sessionCheckInterval = null;

function startSessionMonitoring() {
  // Clear existing interval if any
  if (sessionCheckInterval) {
    clearInterval(sessionCheckInterval);
  }
  
  // Check session status every 30 seconds
  sessionCheckInterval = setInterval(() => {
    getToken(async (token) => {
      if (token) {
        try {
          const user = await getCurrentUser();
          const userId = user._id || user.id;
          
          if (userId) {
            const activeSessions = await getActiveFocusSessions(userId);
            const backendSessionId = activeSessions.length > 0 ? (activeSessions[0]._id || activeSessions[0].id) : null;
            
            // Check if session state has changed
            if (backendSessionId && !currentSessionId) {
              // Session started elsewhere
              console.log('🔄 Session detected from backend:', backendSessionId);
              currentSessionId = backendSessionId;
              chrome.storage.local.set({ activeSessionId: currentSessionId });
              updateSessionStatus(true);
              chrome.runtime.sendMessage({ action: "startBlocking" });
            } else if (!backendSessionId && currentSessionId) {
              // Session ended elsewhere
              console.log('🔄 Session ended detected from backend');
              currentSessionId = null;
              chrome.storage.local.remove("activeSessionId");
              updateSessionStatus(false);
              chrome.runtime.sendMessage({ action: "stopBlocking" });
              loadGamificationStats(); // Refresh stats
            }
          }
        } catch (error) {
          console.debug('Session monitoring check failed:', error.message);
        }
      }
    });
  }, 30000); // Check every 30 seconds
}

// Initialize when popup opens
initializePopup();

// Start session monitoring after initialization
setTimeout(() => {
  getToken((token) => {
    if (token) {
      startSessionMonitoring();
    }
  });
}, 2000);
