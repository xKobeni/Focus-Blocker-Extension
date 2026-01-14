// Get token from storage
function getToken(callback) {
  chrome.storage.local.get("token", (res) => {
    callback(res.token || null);
  });
}

// Save token to storage
function saveToken(token) {
  chrome.storage.local.set({ token }, () => {
    console.log("✅ Token saved to extension storage");
  });
}

// Clear token from storage
function clearToken() {
  chrome.storage.local.remove("token", () => {
    console.log("🗑️ Token cleared from extension storage");
  });
}

// Check if user is authenticated
function isAuthenticated(callback) {
  getToken((token) => {
    callback(!!token);
  });
}
