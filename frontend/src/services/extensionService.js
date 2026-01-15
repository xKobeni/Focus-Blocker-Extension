// Service to communicate with the Chrome extension

const EXTENSION_ID = 'YOUR_EXTENSION_ID_HERE'; // Will be replaced after extension is loaded

/**
 * Send authentication token to the extension
 * This should be called after successful login
 */
export function sendTokenToExtension(token) {
  if (!token) {
    console.error('No token provided to send to extension');
    return;
  }

  // Create a new window/tab that the extension can access
  // The extension's auth-bridge.html will receive the token and store it
  const extensionAuthUrl = chrome?.runtime?.getURL 
    ? chrome.runtime.getURL('auth-bridge.html')
    : `chrome-extension://${EXTENSION_ID}/auth-bridge.html`;

  // Open the bridge page with token as URL parameter
  window.open(`${extensionAuthUrl}?token=${token}`, '_blank', 'width=400,height=400');
}

/**
 * Alternative: Use postMessage to communicate with extension
 * This requires the extension to have a content script listening
 */
export function postTokenToExtension(token) {
  window.postMessage(
    {
      type: 'FOCUS_BLOCKER_AUTH',
      token: token
    },
    '*'
  );
}

/**
 * Check if extension is installed
 */
export function isExtensionInstalled() {
  return new Promise((resolve) => {
    // Try to detect if extension is installed
    // This is a simple check - you may need to adjust based on your setup
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      resolve(true);
    } else {
      resolve(false);
    }
  });
}

/**
 * Notify user to install extension
 */
export function promptExtensionInstall() {
  const shouldInstall = window.confirm(
    'For the best experience, please install the Focus Blocker Chrome Extension. Would you like to open the extension folder?'
  );
  
  if (shouldInstall) {
    alert('Please load the extension from the "extension" folder in the project directory:\n\n' +
          '1. Open Chrome and go to chrome://extensions/\n' +
          '2. Enable "Developer mode"\n' +
          '3. Click "Load unpacked"\n' +
          '4. Select the extension folder');
  }
}

/**
 * Notify extension to sync data from backend
 * This is called when changes are made in the web app
 */
export function notifyExtensionSync(type = 'all') {
  // Send message to extension content script to reload data
  window.postMessage(
    {
      type: 'FOCUS_BLOCKER_SYNC_REQUEST',
      syncType: type // 'all', 'blockedSites', 'timeLimits', 'schedules', 'customBlockPage', 'focusSession'
    },
    '*'
  );
  console.log(`🔄 Notified extension to sync: ${type}`);
}
