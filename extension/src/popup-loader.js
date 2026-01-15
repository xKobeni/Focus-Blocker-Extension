// Popup loader script - loads frontend popup in iframe
// Note: config.js must be loaded before this script to provide FRONTEND_URL
(function() {
  // Use FRONTEND_URL from config.js (loaded before this script)
  // config.js exposes it on window.FRONTEND_URL
  const frontendUrl = (typeof window !== 'undefined' && window.FRONTEND_URL) 
    ? window.FRONTEND_URL 
    : 'http://localhost:5173';
  const frame = document.getElementById('frontendFrame');
  const loading = document.getElementById('loading');
  const error = document.getElementById('error');

  function loadFrontendPopup() {
    try {
      frame.src = frontendUrl + '/popup';
      
      frame.onload = () => {
        console.log('✅ Frontend popup loaded');
        loading.style.display = 'none';
        error.style.display = 'none';
        frame.style.display = 'block';
      };

      frame.onerror = () => {
        showError('Failed to load frontend popup');
      };

      // Timeout check
      setTimeout(() => {
        try {
          if (!frame.contentWindow || frame.contentWindow.location.href === 'about:blank') {
            showError('Frontend popup did not load. Make sure the frontend is running at ' + frontendUrl);
          }
        } catch (e) {
          // Cross-origin, can't check
        }
      }, 5000);
    } catch (err) {
      showError('Error: ' + err.message);
    }
  }

  function showError(message) {
    document.getElementById('errorText').textContent = message;
    loading.style.display = 'none';
    error.style.display = 'flex';
    frame.style.display = 'none';
  }

  function retryLoad() {
    error.style.display = 'none';
    loading.style.display = 'flex';
    frame.style.display = 'none';
    loadFrontendPopup();
  }

  // Make retryLoad available globally for the button
  window.retryLoad = retryLoad;

  // Attach retry button handler
  function attachRetryButton() {
    const retryBtn = document.getElementById('retryBtn');
    if (retryBtn) {
      retryBtn.addEventListener('click', retryLoad);
    }
  }

  // Listen for messages from frontend popup
  window.addEventListener('message', (event) => {
    // Only accept messages from frontend origin
    if (event.origin !== frontendUrl.replace(/\/$/, '')) return;

    if (event.data.type === 'FOCUS_BLOCKER_POPUP_READY') {
      console.log('✅ Frontend popup is ready');
      
      // Check if there's an active session in extension storage and notify frontend
      chrome.storage.local.get(['activeSessionId'], (result) => {
        if (result.activeSessionId) {
          console.log('🔄 Notifying frontend about existing session:', result.activeSessionId);
          frame.contentWindow.postMessage({
            type: 'FOCUS_BLOCKER_SYNC_SESSION'
          }, frontendUrl);
        }
      });
    }

    if (event.data.type === 'FOCUS_BLOCKER_OPEN_LOGIN') {
      // Open login in new tab
      chrome.tabs.create({ url: frontendUrl + '/login' });
    }

    if (event.data.type === 'FOCUS_BLOCKER_SESSION_STARTED') {
      // Store session ID and notify background script
      console.log('🔥 Session started from web:', event.data.sessionId);
      chrome.storage.local.set({ activeSessionId: event.data.sessionId }, () => {
        chrome.runtime.sendMessage({ 
          action: 'startBlocking',
          sessionId: event.data.sessionId
        });
      });
    }

    if (event.data.type === 'FOCUS_BLOCKER_SESSION_ENDED') {
      // Clear session and notify background script
      console.log('✅ Session ended from web');
      chrome.storage.local.remove('activeSessionId', () => {
        chrome.runtime.sendMessage({ action: 'stopBlocking' });
      });
    }

    if (event.data.type === 'FOCUS_BLOCKER_LOGOUT') {
      // Clear token and session
      chrome.storage.local.remove(['token', 'activeSessionId'], () => {
        chrome.runtime.sendMessage({ action: 'stopBlocking' });
      });
    }
  });
  
  // Listen for session changes in chrome.storage and notify frontend
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local' && changes.activeSessionId) {
      console.log('🔄 Session changed in storage, notifying frontend');
      
      if (frame && frame.contentWindow) {
        frame.contentWindow.postMessage({
          type: 'FOCUS_BLOCKER_SYNC_SESSION'
        }, frontendUrl);
      }
    }
  });

  // Initialize when DOM is ready
  function init() {
    attachRetryButton();
    loadFrontendPopup();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
