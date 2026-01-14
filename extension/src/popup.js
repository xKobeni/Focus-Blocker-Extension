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
      chrome.tabs.sendMessage(tabs[0].id, { action: "requestTokenFromFrontend" });
      
      // Wait a bit for the token to arrive
      setTimeout(() => {
        getToken(async (token) => {
          if (token) {
            try {
              const user = await getCurrentUser();
              showControls(user.name || user.email);
              console.log("✅ Successfully synced with frontend!");
            } catch (error) {
              console.error("Token verification failed:", error);
              showAuth();
            }
          } else {
            console.log("❌ No token received from frontend");
            showAuth();
          }
        });
      }, 1000);
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
  
  // Check if there's an active session
  chrome.storage.local.get("activeSessionId", (result) => {
    if (result.activeSessionId) {
      currentSessionId = result.activeSessionId;
      updateSessionStatus(true);
    } else {
      updateSessionStatus(false);
    }
  });
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
  chrome.tabs.create({ url: FRONTEND_URL + "/login" });
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
    
  } catch (error) {
    console.error("Failed to start focus session:", error);
    statusText.textContent = "❌ Failed to start";
    setTimeout(() => updateSessionStatus(false), 2000);
    alert("Failed to start focus session: " + error.message);
  }
};

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
    });
    
  } catch (error) {
    console.error("Failed to end focus session:", error);
    statusText.textContent = "❌ Failed to end";
    setTimeout(() => updateSessionStatus(true), 2000);
    alert("Failed to end focus session: " + error.message);
  }
};

// Initialize when popup opens
initializePopup();
