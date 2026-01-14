console.log("🎯 Focus Blocker content script running");

let isBlockingActive = false;
let blockedSites = [];
let overlayInjected = false;

// Helper function to check if a domain is blocked (improved matching)
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

// Check if current site should be blocked and inject overlay if needed
async function checkAndBlockCurrentSite() {
  // Skip if already on extension pages (but allow blocked.html to load custom settings)
  if (window.location.href.includes('chrome-extension://') && 
      !window.location.href.includes('blocked.html')) {
    return;
  }
  
  // Skip chrome:// pages
  if (window.location.href.includes('chrome://')) {
    return;
  }
  
  // If we're on blocked.html, it will load custom settings itself
  if (window.location.href.includes('blocked.html')) {
    return;
  }

  try {
    const currentUrl = window.location.href;
    const urlObj = new URL(currentUrl);
    const domain = urlObj.hostname;
    const cleanDomain = domain.replace(/^www\./, '');

    // Check if site is blocked using improved matching
    const isBlocked = isDomainBlocked(domain);
    
    // Check time limits and schedules asynchronously
    const timeLimitInfo = await new Promise((resolve) => {
      chrome.storage.local.get(['timeLimits'], (result) => {
        if (result.timeLimits && result.timeLimits.length > 0) {
          const limit = result.timeLimits.find(limit => {
            const limitDomain = limit.domain.replace(/^www\./, '').toLowerCase();
            const cleanDomain = domain.replace(/^www\./, '').toLowerCase();
            return cleanDomain === limitDomain || 
                   cleanDomain.endsWith('.' + limitDomain) ||
                   limitDomain.endsWith('.' + cleanDomain);
          });
          
          if (limit) {
            const timeUsedMinutes = limit.timeUsedToday / 60;
            const limitMinutes = limit.dailyLimitMinutes;
            const isExceeded = timeUsedMinutes >= limitMinutes;
            
            resolve({
              limit,
              timeUsedMinutes,
              limitMinutes,
              remainingMinutes: Math.max(0, limitMinutes - timeUsedMinutes),
              isExceeded,
              action: limit.action || 'block'
            });
            return;
          }
        }
        resolve(null);
      });
    });
    
    // Check schedules
    const scheduleBlocked = await new Promise((resolve) => {
      chrome.storage.local.get(['activeSchedules'], (result) => {
        if (result.activeSchedules && result.activeSchedules.length > 0) {
          const now = new Date();
          const currentDay = now.getDay();
          const currentTime = now.toTimeString().slice(0, 5);
          
          const blocked = result.activeSchedules.some(schedule => {
            const matchesDay = schedule.daysOfWeek.includes(currentDay);
            const matchesTime = currentTime >= schedule.startTime && currentTime <= schedule.endTime;
            
            if (matchesDay && matchesTime) {
              if (schedule.action === 'block_all') return true;
              // Add more schedule logic here
            }
            return false;
          });
          
          resolve(blocked);
        } else {
          resolve(false);
        }
      });
    });

    // CRITICAL: Double-check that we have an active session before blocking
    // This prevents blocking when no session is active
    const hasActiveSession = await new Promise((resolve) => {
      chrome.storage.local.get(['activeSessionId'], (result) => {
        resolve(!!result.activeSessionId);
      });
    });
    
    // Block ONLY if: session is active AND (blocked site OR time limit exceeded OR schedule active)
    const shouldBlock = hasActiveSession && isBlockingActive && (isBlocked || (timeLimitInfo && timeLimitInfo.isExceeded) || scheduleBlocked);

    if (shouldBlock) {
      if (!overlayInjected) {
        const reason = scheduleBlocked ? 'schedule' : (timeLimitInfo && timeLimitInfo.isExceeded ? 'time limit' : 'blocked site');
        console.log(`🚫 Content script: Blocking ${domain} (reason: ${reason}, session active: ${hasActiveSession})`);
        await injectOverlay(timeLimitInfo);
      }
      // Prevent any navigation
      preventPageInteraction();
    } else {
      // Always remove overlay if we shouldn't block
      if (overlayInjected) {
        console.log(`✅ Content script: Not blocking ${domain} (isBlockingActive: ${isBlockingActive}, hasActiveSession: ${hasActiveSession})`);
      }
      removeOverlay();
      restorePageInteraction();
    }
  } catch (error) {
    console.error("Error checking current site:", error);
  }
}

// Inject overlay to block the page
async function injectOverlay(timeLimitInfo = null) {
  if (overlayInjected) return;
  
  overlayInjected = true;
  
  // Get custom block page settings - wait a bit to ensure data is loaded
  let blockPageData = null;
  try {
    // Try multiple times to get the data (in case it's still loading)
    for (let i = 0; i < 5; i++) {
      const result = await new Promise((resolve) => {
        chrome.storage.local.get(['customBlockPage'], (data) => {
          resolve(data.customBlockPage || null);
        });
      });
      
      if (result) {
        blockPageData = result;
        console.log('✅ Custom block page data loaded in content script:', {
          title: blockPageData.title || '(default)',
          message: blockPageData.message?.substring(0, 30) + '...' || '(default)',
          quote: blockPageData.quote?.substring(0, 30) + '...' || '(default)',
          iconType: blockPageData.iconType,
          hasIconUrl: !!blockPageData.iconUrl,
          backgroundColor: blockPageData.backgroundColor?.substring(0, 40) + '...' || '(default)',
          textColor: blockPageData.textColor || '(default)',
          isActive: blockPageData.isActive
        });
        break;
      }
      
      // Wait a bit before retrying (longer wait for later attempts)
      if (i < 4) {
        await new Promise(resolve => setTimeout(resolve, 300 * (i + 1)));
      }
    }
    
    if (!blockPageData) {
      console.log('⚠️ No custom block page data found after retries, using defaults');
      // Try one more time to get it directly
      const finalCheck = await new Promise((resolve) => {
        chrome.storage.local.get(['customBlockPage'], (data) => {
          resolve(data.customBlockPage || null);
        });
      });
      if (finalCheck) {
        blockPageData = finalCheck;
        console.log('✅ Got custom block page on final check:', {
          title: finalCheck.title,
          hasMessage: !!finalCheck.message,
          hasQuote: !!finalCheck.quote
        });
      }
    }
  } catch (error) {
    console.error('Error loading custom block page:', error);
  }
  
  // Use custom block page data or defaults
  // Check if blockPageData exists and has the field, even if empty string
  let title = (blockPageData && blockPageData.hasOwnProperty('title')) 
    ? (blockPageData.title || 'Site Blocked') 
    : 'Site Blocked';
  let message = (blockPageData && blockPageData.hasOwnProperty('message'))
    ? (blockPageData.message || 'This website is on your blocked list during focus sessions.')
    : 'This website is on your blocked list during focus sessions.';
  
  // Override message if time limit exceeded
  if (timeLimitInfo && timeLimitInfo.isExceeded) {
    title = 'Time Limit Exceeded';
    message = `You've reached your daily time limit of ${timeLimitInfo.limitMinutes} minutes for this site. Time used: ${Math.round(timeLimitInfo.timeUsedMinutes)} minutes.`;
  }
  
  const quote = (blockPageData && blockPageData.hasOwnProperty('quote'))
    ? (blockPageData.quote || 'Focus is the gateway to thinking clearly, and clear thinking is the gateway to true productivity.')
    : 'Focus is the gateway to thinking clearly, and clear thinking is the gateway to true productivity.';
  const backgroundColor = (blockPageData && blockPageData.hasOwnProperty('backgroundColor') && blockPageData.backgroundColor)
    ? blockPageData.backgroundColor
    : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
  const textColor = (blockPageData && blockPageData.hasOwnProperty('textColor') && blockPageData.textColor)
    ? blockPageData.textColor
    : '#ffffff';
  
  console.log('🎨 Using block page settings:', {
    hasBlockPageData: !!blockPageData,
    title,
    message: message.substring(0, 50) + '...',
    quote: quote.substring(0, 50) + '...',
    backgroundColor: backgroundColor.substring(0, 50) + '...',
    textColor,
    iconType: blockPageData?.iconType,
    hasIconUrl: !!blockPageData?.iconUrl
  });
  
  // Handle icon (emoji, image, or GIF)
  let iconHtml = '';
  if (blockPageData?.iconType === 'image' || blockPageData?.iconType === 'gif') {
    if (blockPageData?.iconUrl) {
      iconHtml = `<img src="${blockPageData.iconUrl}" alt="Icon" style="max-width: 120px; max-height: 120px; object-fit: contain; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3));" />`;
    } else {
      iconHtml = `<div style="font-size: 80px; margin-bottom: 20px;">🚫</div>`;
    }
  } else {
    iconHtml = `<div style="font-size: 80px; margin-bottom: 20px;">${blockPageData?.icon || '🚫'}</div>`;
  }
  
  // Create overlay element
  const overlay = document.createElement('div');
  overlay.id = 'focus-blocker-overlay';
  
  // Apply background color directly to overlay element for better compatibility
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: ${backgroundColor};
    z-index: 999999;
    display: flex;
    align-items: center;
    justify-content: center;
    color: ${textColor};
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  `;
  
  // Escape HTML to prevent XSS
  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  overlay.innerHTML = `
    <div style="
      text-align: center;
      padding: 40px;
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      border-radius: 20px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
      max-width: 600px;
    ">
      ${iconHtml}
      <h1 style="font-size: 2.5em; margin-bottom: 20px; color: ${textColor}; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">${escapeHtml(title)}</h1>
      <p style="font-size: 1.2em; margin-bottom: 30px; opacity: 0.95; color: ${textColor};">
        ${escapeHtml(message)}
      </p>
      ${timeLimitInfo && timeLimitInfo.isExceeded ? `
        <div style="
          font-size: 1em;
          margin: 20px 0;
          padding: 15px;
          background: rgba(255, 0, 0, 0.2);
          backdrop-filter: blur(5px);
          border-radius: 10px;
          color: ${textColor};
          border: 2px solid rgba(255, 0, 0, 0.4);
        ">
          ⏱️ Time Used: ${Math.round(timeLimitInfo.timeUsedMinutes)} / ${timeLimitInfo.limitMinutes} minutes
          <br>
          <small>Limit resets tomorrow</small>
        </div>
      ` : ''}
      <div style="
        font-style: italic;
        font-size: 1.1em;
        margin: 30px 0;
        padding: 20px;
        background: rgba(255, 255, 255, 0.15);
        backdrop-filter: blur(5px);
        border-radius: 10px;
        color: ${textColor};
        border: 1px solid rgba(255, 255, 255, 0.2);
      ">
        "${escapeHtml(quote)}"
      </div>
      <p style="font-size: 1.1em; margin-bottom: 20px; color: ${textColor}; opacity: 0.9;">Stay focused on your goals! 🎯</p>
    </div>
  `;
  
  // Prevent interaction with page content
  overlay.style.pointerEvents = 'auto';
  document.body.style.overflow = 'hidden';
  
  // Insert overlay
  document.body.appendChild(overlay);
  
  // Prevent navigation
  window.addEventListener('beforeunload', preventNavigation, true);
  window.addEventListener('unload', preventNavigation, true);
  
  // Block all clicks and keyboard events
  overlay.addEventListener('click', (e) => e.stopPropagation(), true);
  overlay.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' || e.key === 'F5') {
      e.preventDefault();
      e.stopPropagation();
    }
  }, true);
  
  // Prevent page interaction
  preventPageInteraction();
}

// Prevent all page interactions when blocked
function preventPageInteraction() {
  // Block all link clicks
  document.addEventListener('click', blockLinkClicks, true);
  
  // Block form submissions
  document.addEventListener('submit', blockFormSubmit, true);
  
  // Block navigation
  window.addEventListener('beforeunload', blockNavigation, true);
  
  // Block keyboard shortcuts that might navigate
  document.addEventListener('keydown', blockNavigationKeys, true);
  
  // Block right-click context menu
  document.addEventListener('contextmenu', blockContextMenu, true);
  
  // Disable all links
  const links = document.querySelectorAll('a');
  links.forEach(link => {
    link.addEventListener('click', blockLinkClicks, true);
    link.style.pointerEvents = 'none';
    link.style.cursor = 'not-allowed';
  });
}

// Restore page interactions
function restorePageInteraction() {
  document.removeEventListener('click', blockLinkClicks, true);
  document.removeEventListener('submit', blockFormSubmit, true);
  window.removeEventListener('beforeunload', blockNavigation, true);
  document.removeEventListener('keydown', blockNavigationKeys, true);
  document.removeEventListener('contextmenu', blockContextMenu, true);
  
  const links = document.querySelectorAll('a');
  links.forEach(link => {
    link.removeEventListener('click', blockLinkClicks, true);
    link.style.pointerEvents = '';
    link.style.cursor = '';
  });
}

// Block link clicks to blocked sites
function blockLinkClicks(e) {
  const link = e.target.closest('a');
  if (!link || !link.href) return;
  
  try {
    const url = new URL(link.href, window.location.href);
    const domain = url.hostname;
    
    if (isDomainBlocked(domain)) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      console.log(`🚫 Blocked link click to: ${domain}`);
      return false;
    }
  } catch (error) {
    // Invalid URL, allow it
  }
}

// Block form submissions
function blockFormSubmit(e) {
  e.preventDefault();
  e.stopPropagation();
  e.stopImmediatePropagation();
  console.log('🚫 Blocked form submission');
  return false;
}

// Block navigation
function blockNavigation(e) {
  e.preventDefault();
  e.stopPropagation();
  return false;
}

// Block navigation keyboard shortcuts
function blockNavigationKeys(e) {
  // Block Ctrl+L (address bar), Ctrl+T (new tab), Ctrl+W (close tab), etc.
  if (e.ctrlKey || e.metaKey) {
    if (['l', 't', 'w', 'n', 'r'].includes(e.key.toLowerCase())) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  }
  
  // Block F5 (refresh)
  if (e.key === 'F5') {
    e.preventDefault();
    e.stopPropagation();
    return false;
  }
}

// Block context menu
function blockContextMenu(e) {
  e.preventDefault();
  e.stopPropagation();
  return false;
}

// Remove overlay
function removeOverlay() {
  if (!overlayInjected) return;
  
  const overlay = document.getElementById('focus-blocker-overlay');
  if (overlay) {
    overlay.remove();
    overlayInjected = false;
    document.body.style.overflow = '';
    window.removeEventListener('beforeunload', preventNavigation, true);
    window.removeEventListener('unload', preventNavigation, true);
    
    // Restore page interactions
    restorePageInteraction();
  }
}

function preventNavigation(e) {
  e.preventDefault();
  e.stopPropagation();
  return false;
}

// Load blocking state and blocked sites
async function loadBlockingState() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['isBlocking', 'blockedSites', 'activeSessionId', 'customBlockPage', 'timeLimits', 'activeSchedules'], (result) => {
      isBlockingActive = result.isBlocking === true && !!result.activeSessionId;
      blockedSites = result.blockedSites || [];
      console.log('📋 Content script: Blocking state loaded', {
        isBlocking: isBlockingActive,
        blockedSitesCount: blockedSites.length,
        hasCustomBlockPage: !!result.customBlockPage,
        timeLimitsCount: result.timeLimits?.length || 0,
        activeSchedulesCount: result.activeSchedules?.length || 0
      });
      resolve();
    });
  });
}

// Initialize when DOM is ready
function initializeContentScript() {
  // Load blocking state immediately
  loadBlockingState().then(() => {
    // Double-check that we have an active session before checking
    chrome.storage.local.get(['activeSessionId', 'isBlocking'], (result) => {
      const hasActiveSession = !!result.activeSessionId;
      const isBlocking = result.isBlocking === true;
      
      // Only proceed with blocking checks if we have an active session
      if (!hasActiveSession || !isBlocking) {
        console.log('ℹ️ Content script: No active session, blocking disabled', {
          hasActiveSession,
          isBlocking,
          isBlockingActive
        });
        // Make sure overlay is removed if no session
        removeOverlay();
        return;
      }
      
      // Check immediately
      checkAndBlockCurrentSite();
      
      // Check again when DOM is ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          checkAndBlockCurrentSite();
          // Check again after a short delay to handle dynamic content
          setTimeout(checkAndBlockCurrentSite, 500);
        });
      } else {
        // DOM already loaded, check again
        setTimeout(checkAndBlockCurrentSite, 100);
        setTimeout(checkAndBlockCurrentSite, 500);
      }
    });
  });
}

// Start initialization
initializeContentScript();

// Listen for messages from the web page (frontend)
window.addEventListener("message", (event) => {
  // Only accept messages from the same origin
  if (event.source !== window) return;

  // Check if it's a token message from our frontend
  if (event.data.type === "FOCUS_BLOCKER_AUTH" && event.data.token) {
    console.log("📩 Received token from frontend");
    
    // Store the token in extension storage
    chrome.storage.local.set({ token: event.data.token }, () => {
      console.log("✅ Token saved to extension storage");
      
      // Notify background script to reload blocked sites
      chrome.runtime.sendMessage({ action: "reloadBlockedSites" });
      
      // Notify any listening popup that token is now available
      chrome.runtime.sendMessage({ action: "tokenUpdated", token: event.data.token });
    });
  }
});

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "requestTokenFromFrontend") {
    console.log("📨 Popup requested token from frontend");
    
    // Request token from the frontend page
    window.postMessage({ type: "FOCUS_BLOCKER_REQUEST_TOKEN" }, "*");
    
    sendResponse({ status: "requested" });
  } else if (message.action === "updateBlockingState") {
    console.log("🔄 Content script: Blocking state updated", message);
    
    // CRITICAL: Only activate blocking if BOTH isBlocking is true AND there's an active session
    // Use activeSessionId from message if provided, otherwise check storage
    const activeSessionId = message.activeSessionId !== undefined 
      ? message.activeSessionId 
      : (await new Promise((resolve) => {
          chrome.storage.local.get(['activeSessionId'], (result) => {
            resolve(result.activeSessionId);
          });
        }));
    
    isBlockingActive = message.isBlocking === true && !!activeSessionId;
    blockedSites = message.blockedSites || [];
    
    console.log('🔒 Blocking state:', {
      isBlocking: message.isBlocking,
      activeSessionId: activeSessionId,
      hasActiveSession: !!activeSessionId,
      isBlockingActive: isBlockingActive
    });
    
    // Update all blocking-related data
    const updateData = {};
    if (message.customBlockPage !== undefined) {
      updateData.customBlockPage = message.customBlockPage;
    }
    if (message.timeLimits !== undefined) {
      updateData.timeLimits = message.timeLimits;
    }
    if (message.activeSchedules !== undefined) {
      updateData.activeSchedules = message.activeSchedules;
    }
    
    if (Object.keys(updateData).length > 0) {
      chrome.storage.local.set(updateData);
    }
    
    // Remove overlay first, then re-check (will inject with new settings if needed)
    removeOverlay();
    overlayInjected = false; // Reset flag
    setTimeout(() => {
      checkAndBlockCurrentSite();
    }, 50);
    
    sendResponse({ status: "updated" });
  } else if (message.action === "checkBlocking") {
    overlayInjected = false; // Reset flag to allow re-check
    checkAndBlockCurrentSite();
    sendResponse({ status: "checked" });
  } else if (message.action === "timeLimitExceeded") {
    overlayInjected = false; // Reset flag
    injectOverlay(message.timeLimitInfo);
    sendResponse({ status: "blocked" });
  } else if (message.action === "scheduleActive") {
    overlayInjected = false; // Reset flag
    checkAndBlockCurrentSite();
    sendResponse({ status: "checked" });
  }
  return true;
});

// Monitor URL changes (for SPAs) and block navigation to blocked sites
let lastUrl = location.href;

// Intercept pushState and replaceState for SPAs
const originalPushState = history.pushState;
const originalReplaceState = history.replaceState;

history.pushState = function(...args) {
  originalPushState.apply(history, args);
  handleUrlChange();
};

history.replaceState = function(...args) {
  originalReplaceState.apply(history, args);
  handleUrlChange();
};

function handleUrlChange() {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    overlayInjected = false; // Reset overlay state on navigation
    
    // Check if new URL is blocked
    setTimeout(() => {
      checkAndBlockCurrentSite();
    }, 100);
  }
}

// Monitor DOM changes for URL changes
new MutationObserver(() => {
  handleUrlChange();
}).observe(document, { subtree: true, childList: true });

// Also check on popstate (back/forward navigation)
window.addEventListener('popstate', () => {
  overlayInjected = false;
  setTimeout(checkAndBlockCurrentSite, 100);
});

// Monitor for new links being added dynamically
const linkObserver = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    mutation.addedNodes.forEach((node) => {
      if (node.nodeType === 1) { // Element node
        // Check if it's a link
        if (node.tagName === 'A' && node.href) {
          try {
            const url = new URL(node.href, window.location.href);
            if (isDomainBlocked(url.hostname)) {
              node.addEventListener('click', blockLinkClicks, true);
              node.style.pointerEvents = 'none';
              node.style.cursor = 'not-allowed';
            }
          } catch (e) {
            // Invalid URL
          }
        }
        // Check for links inside the node
        const links = node.querySelectorAll && node.querySelectorAll('a');
        if (links) {
          links.forEach(link => {
            if (link.href) {
              try {
                const url = new URL(link.href, window.location.href);
                if (isDomainBlocked(url.hostname)) {
                  link.addEventListener('click', blockLinkClicks, true);
                  link.style.pointerEvents = 'none';
                  link.style.cursor = 'not-allowed';
                }
              } catch (e) {
                // Invalid URL
              }
            }
          });
        }
      }
    });
  });
});

// Start observing for dynamically added links
linkObserver.observe(document.body, {
  childList: true,
  subtree: true
});

// Monitor user activity during focus sessions
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    console.log("👀 User switched tab");
  } else {
    // Re-check when tab becomes visible
    checkAndBlockCurrentSite();
  }
});
