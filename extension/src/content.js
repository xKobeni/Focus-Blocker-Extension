console.log("🎯 Focus Blocker content script running");

let isBlockingActive = false;
let blockedSites = [];
let overlayInjected = false;

// Helper function to check if a domain is blocked (improved matching)
function isDomainBlocked(domain) {
  // CRITICAL: If no blocked sites, nothing is blocked
  if (!blockedSites || blockedSites.length === 0) {
    return false;
  }
  
  // If domain is empty or invalid, don't block
  if (!domain || typeof domain !== 'string') {
    return false;
  }
  
  const cleanDomain = domain.replace(/^www\./, '').toLowerCase();
  
  const isBlocked = blockedSites.some(blocked => {
    if (!blocked || typeof blocked !== 'string') return false;
    const cleanBlocked = blocked.replace(/^www\./, '').toLowerCase();
    // Exact match or domain ends with blocked domain (e.g., facebook.com matches m.facebook.com)
    return cleanDomain === cleanBlocked || 
           cleanDomain.endsWith('.' + cleanBlocked) ||
           cleanBlocked.endsWith('.' + cleanDomain);
  });
  
  if (isBlocked) {
    console.log(`🔍 Domain ${domain} IS in blocked list`);
  } else {
    console.log(`🔍 Domain ${domain} is NOT in blocked list (blocked sites: ${blockedSites.join(', ')})`);
  }
  
  return isBlocked;
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
  
  // Skip file:// pages (local files)
  if (window.location.href.startsWith('file://')) {
    return;
  }
  
  // Skip about: pages
  if (window.location.href.startsWith('about:')) {
    return;
  }
  
  // If we're on blocked.html, it will load custom settings itself
  if (window.location.href.includes('blocked.html')) {
    return;
  }

  try {
    const currentUrl = window.location.href;
    
    // Skip invalid URLs
    if (!currentUrl || currentUrl.trim() === '') {
      return;
    }
    
    let urlObj;
    try {
      urlObj = new URL(currentUrl);
    } catch (e) {
      // Invalid URL, skip blocking
      console.debug('Invalid URL, skipping:', currentUrl);
      return;
    }
    
    const domain = urlObj.hostname;
    
    // CRITICAL: Skip localhost, 127.0.0.1, and other local addresses
    if (!domain || 
        domain === 'localhost' || 
        domain === '127.0.0.1' || 
        domain === '0.0.0.0' ||
        domain.startsWith('192.168.') ||
        domain.startsWith('10.') ||
        domain.startsWith('172.16.') ||
        domain.startsWith('172.17.') ||
        domain.startsWith('172.18.') ||
        domain.startsWith('172.19.') ||
        domain.startsWith('172.20.') ||
        domain.startsWith('172.21.') ||
        domain.startsWith('172.22.') ||
        domain.startsWith('172.23.') ||
        domain.startsWith('172.24.') ||
        domain.startsWith('172.25.') ||
        domain.startsWith('172.26.') ||
        domain.startsWith('172.27.') ||
        domain.startsWith('172.28.') ||
        domain.startsWith('172.29.') ||
        domain.startsWith('172.30.') ||
        domain.startsWith('172.31.') ||
        domain.endsWith('.local')) {
      console.log(`✅ Skipping local/system domain: ${domain}`);
      removeOverlay();
      restorePageInteraction();
      return;
    }
    
    const cleanDomain = domain.replace(/^www\./, '');

    // CRITICAL: Double-check that we have an active session before blocking
    // This prevents blocking when no session is active
    const hasActiveSession = await new Promise((resolve) => {
      chrome.storage.local.get(['activeSessionId'], (result) => {
        resolve(!!result.activeSessionId);
      });
    });
    
    // If no active session, don't block anything
    if (!hasActiveSession) {
      removeOverlay();
      restorePageInteraction();
      return;
    }
    
    // If blocking is not active, don't block anything
    if (!isBlockingActive) {
      removeOverlay();
      restorePageInteraction();
      return;
    }
    
    // Check if site is blocked using improved matching
    const isBlocked = isDomainBlocked(domain);
    
    // SAFETY CHECK: Log blocking state for debugging
    console.log(`🔍 Pre-check for ${domain}:`, {
      blockedSitesCount: blockedSites.length,
      blockedSitesList: blockedSites,
      isBlocked: isBlocked,
      hasActiveSession: hasActiveSession,
      isBlockingActive: isBlockingActive
    });
    
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
    
    // Check schedules - IMPORTANT: Only block if schedule applies AND site is actually blocked
    const scheduleBlocked = await new Promise((resolve) => {
      chrome.storage.local.get(['activeSchedules', 'blockedSites'], (result) => {
        if (result.activeSchedules && result.activeSchedules.length > 0) {
          const now = new Date();
          const currentDay = now.getDay();
          const currentTime = now.toTimeString().slice(0, 5);
          
          // Check if any active schedule applies to this site
          const activeSchedule = result.activeSchedules.find(schedule => {
            const matchesDay = schedule.daysOfWeek && schedule.daysOfWeek.includes(currentDay);
            const matchesTime = schedule.startTime && schedule.endTime && 
                               currentTime >= schedule.startTime && currentTime <= schedule.endTime;
            
            return matchesDay && matchesTime;
          });
          
          if (activeSchedule) {
            // Only block_all schedules block everything
            if (activeSchedule.action === 'block_all') {
              console.log(`📅 Schedule active (block_all): blocking all sites`);
              resolve(true);
              return;
            }
            
            // For other schedule actions, ONLY block if site is in blocked list
            if (isBlocked) {
              console.log(`📅 Schedule active: blocking ${domain} (site is in blocked list)`);
              resolve(true);
              return;
            } else {
              console.log(`📅 Schedule active but ${domain} is not in blocked list - allowing`);
              resolve(false);
              return;
            }
          }
          
          resolve(false);
        } else {
          resolve(false);
        }
      });
    });

    // CRITICAL BLOCKING LOGIC:
    // We ONLY block if ALL of these are true:
    // 1. There's an active session
    // 2. Blocking is enabled
    // 3. The site is ACTUALLY in the blocked list OR time limit exceeded OR block_all schedule is active
    
    // CRITICAL SAFETY CHECK: If we have NO blocked sites, NO time limits, and NO schedules, never block
    const hasAnyBlockingRules = blockedSites.length > 0 || 
                                 (timeLimitInfo !== null) || 
                                 scheduleBlocked;
    
    if (!hasAnyBlockingRules) {
      console.log(`⚠️ SAFETY: No blocking rules configured - allowing ${domain}`);
      removeOverlay();
      restorePageInteraction();
      return;
    }
    
    // First, check if we should block at all
    const hasReasonToBlock = isBlocked || (timeLimitInfo && timeLimitInfo.isExceeded) || scheduleBlocked;
    
    // Log the blocking decision with full details
    console.log(`🔍 Blocking check for ${domain}:`, {
      hasActiveSession,
      isBlockingActive,
      isBlocked,
      timeLimitExceeded: !!(timeLimitInfo && timeLimitInfo.isExceeded),
      scheduleBlocked,
      hasReasonToBlock,
      blockedSitesCount: blockedSites.length,
      blockedSites: blockedSites
    });
    
    // CRITICAL: If site is NOT blocked and no time limit/schedule applies, NEVER block
    if (!hasReasonToBlock) {
      console.log(`✅ ALLOWING ${domain} - not in blocked list, no time limit exceeded, no block_all schedule active`);
      removeOverlay();
      restorePageInteraction();
      return;
    }
    
    // Only block if we have an active session AND blocking is enabled AND we have a reason to block
    const shouldBlock = hasActiveSession && isBlockingActive && hasReasonToBlock;
    
    if (shouldBlock) {
      // Log why we're blocking
      const reasons = [];
      if (isBlocked) reasons.push('in blocked list');
      if (timeLimitInfo && timeLimitInfo.isExceeded) reasons.push('time limit exceeded');
      if (scheduleBlocked) reasons.push('block_all schedule active');
      console.log(`🚫 BLOCKING ${domain} because: ${reasons.join(', ')}`);
      
      if (!overlayInjected) {
        const reason = scheduleBlocked ? 'schedule' : (timeLimitInfo && timeLimitInfo.isExceeded ? 'time limit' : 'blocked site');
        await injectOverlay(timeLimitInfo);
      }
      // Prevent any navigation
      preventPageInteraction();
    } else {
      // Always remove overlay if we shouldn't block
      if (overlayInjected) {
        console.log(`✅ REMOVING BLOCK for ${domain} - shouldBlock is false`);
      }
      removeOverlay();
      restorePageInteraction();
    }
  } catch (error) {
    console.error("Error checking current site:", error);
    // On error, don't block - allow the page to load
    removeOverlay();
    restorePageInteraction();
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
      // CRITICAL: Only activate blocking if:
      // 1. Blocking is enabled in background script
      // 2. There's an active session
      // 3. We have at least some blocked sites, time limits, or schedules configured
      const hasBlockedSites = (result.blockedSites && result.blockedSites.length > 0);
      const hasTimeLimits = (result.timeLimits && result.timeLimits.length > 0);
      const hasSchedules = (result.activeSchedules && result.activeSchedules.length > 0);
      const hasActiveSession = !!result.activeSessionId;
      
      blockedSites = result.blockedSites || [];
      
      // CRITICAL: Only activate blocking if we have an active session AND blocking is enabled AND we have something to block
      // If any of these conditions are false, blocking should be disabled
      isBlockingActive = result.isBlocking === true && 
                        hasActiveSession && 
                        (hasBlockedSites || hasTimeLimits || hasSchedules);
      
      console.log('📋 Content script: Blocking state loaded', {
        isBlocking: result.isBlocking,
        isBlockingActive: isBlockingActive,
        blockedSitesCount: blockedSites.length,
        blockedSites: blockedSites,
        hasActiveSession: hasActiveSession,
        hasTimeLimits: hasTimeLimits,
        hasSchedules: hasSchedules,
        hasCustomBlockPage: !!result.customBlockPage,
        willBlock: isBlockingActive && hasBlockedSites ? 'Only blocked sites' : (isBlockingActive ? 'Time limits/schedules' : 'Nothing - blocking disabled')
      });
      
      // If no blocked sites and no time limits/schedules, make sure we're not blocking
      if (!hasBlockedSites && !hasTimeLimits && !hasSchedules) {
        isBlockingActive = false;
        console.log('⚠️ CRITICAL: No blocked sites, time limits, or schedules - FORCING blocking to disabled');
        removeOverlay();
        restorePageInteraction();
      }
      
      // If we have blocked sites, log them for debugging
      if (hasBlockedSites) {
        console.log('📋 Blocked sites list:', blockedSites);
      }
      
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

// Listen for storage changes to sync across tabs in real-time
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local') {
    // Reload blocking state when relevant data changes
    if (changes.isBlocking || changes.blockedSites || changes.activeSessionId || 
        changes.timeLimits || changes.activeSchedules || changes.customBlockPage) {
      console.log('🔄 Storage changed, reloading blocking state...', Object.keys(changes));
      loadBlockingState().then(() => {
        // Re-check current site after state reload
        checkAndBlockCurrentSite();
      });
    }
  }
});

// Helper function to get token from page's localStorage (injected script)
function getTokenFromPageStorage() {
  return new Promise((resolve) => {
    // Inject a script into the page context to access localStorage
    const script = document.createElement('script');
    script.textContent = `
      (function() {
        try {
          const token = localStorage.getItem('auth_token');
          window.postMessage({ 
            type: 'FOCUS_BLOCKER_TOKEN_FROM_STORAGE', 
            token: token 
          }, '*');
        } catch (e) {
          window.postMessage({ 
            type: 'FOCUS_BLOCKER_TOKEN_FROM_STORAGE', 
            token: null 
          }, '*');
        }
      })();
    `;
    (document.head || document.documentElement).appendChild(script);
    script.remove();
    
    // Listen for the response
    const listener = (event) => {
      if (event.source !== window) return;
      if (event.data.type === 'FOCUS_BLOCKER_TOKEN_FROM_STORAGE') {
        window.removeEventListener('message', listener);
        resolve(event.data.token);
      }
    };
    window.addEventListener('message', listener);
    
    // Timeout after 1 second
    setTimeout(() => {
      window.removeEventListener('message', listener);
      resolve(null);
    }, 1000);
  });
}

// Helper function to save token and notify extension components
function saveTokenToExtension(token) {
  if (!token) return;
  
  console.log("💾 Saving token to extension storage...");
  chrome.storage.local.set({ token: token }, () => {
    console.log("✅ Token saved to extension storage");
    
    // Notify background script to reload blocked sites
    chrome.runtime.sendMessage({ action: "reloadBlockedSites" }, () => {
      if (chrome.runtime.lastError) {
        console.debug("Background script not ready:", chrome.runtime.lastError.message);
      } else {
        console.log("✅ Background script notified to reload blocked sites");
      }
    });
    
    // Notify any listening popup that token is now available
    chrome.runtime.sendMessage({ action: "tokenUpdated", token: token }, () => {
      if (chrome.runtime.lastError) {
        console.debug("Popup not open:", chrome.runtime.lastError.message);
      } else {
        console.log("✅ Popup notified of token update");
      }
    });
  });
}

// Listen for messages from the web page (frontend)
window.addEventListener("message", (event) => {
  // Only accept messages from the same origin
  if (event.source !== window) return;

  // Check if it's a token message from our frontend
  if (event.data.type === "FOCUS_BLOCKER_AUTH" && event.data.token) {
    console.log("📩 Received token from frontend (postMessage)");
    saveTokenToExtension(event.data.token);
  }
  
  // Check if it's a sync request from frontend
  if (event.data.type === "FOCUS_BLOCKER_SYNC_REQUEST") {
    console.log(`🔄 Frontend requested sync: ${event.data.syncType}`);
    // Forward to background script
    chrome.runtime.sendMessage({ 
      action: "syncFromBackend", 
      syncType: event.data.syncType || "all" 
    }, () => {
      if (chrome.runtime.lastError) {
        console.debug("Background script not ready:", chrome.runtime.lastError.message);
      } else {
        console.log("✅ Sync request sent to background script");
      }
    });
  }
});

// Also proactively get token when content script loads
// This helps if the frontend sent the token before the content script was ready
setTimeout(async () => {
  console.log("🔍 Content script ready, checking for token...");
  
  // First try to get from localStorage
  const token = await getTokenFromPageStorage();
  if (token) {
    console.log("🔑 Found token in localStorage on content script load");
    saveTokenToExtension(token);
  } else {
    // Fallback: request from frontend
    console.log("📡 Requesting token from frontend...");
    window.postMessage({ type: "FOCUS_BLOCKER_REQUEST_TOKEN" }, "*");
  }
}, 1000);

// Listen for messages from background script and extension popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Handle session updates from extension popup to notify frontend
  if (message.action === "extensionSessionUpdate") {
    console.log("🔄 Extension session update:", message.type);
    
    // Notify frontend page about session change
    window.postMessage({
      type: 'FOCUS_BLOCKER_EXTENSION_SESSION_UPDATE',
      sessionAction: message.type,
      sessionId: message.sessionId
    }, '*');
    
    sendResponse({ status: "notified" });
    return true;
  } else if (message.action === "requestTokenFromFrontend") {
    console.log("📨 Popup requested token from frontend");
    
    // First, try to get token directly from localStorage (faster)
    getTokenFromPageStorage().then((token) => {
      if (token) {
        console.log("🔑 Found token in page localStorage, saving to extension...");
        saveTokenToExtension(token);
      } else {
        // Fallback: Request token from the frontend page via postMessage
        console.log("🔍 Token not in localStorage, requesting from frontend...");
        window.postMessage({ type: "FOCUS_BLOCKER_REQUEST_TOKEN" }, "*");
      }
    });
    
    sendResponse({ status: "requested" });
  } else if (message.action === "updateBlockingState") {
    console.log("🔄 Content script: Blocking state updated", message);
    
    // CRITICAL: Only activate blocking if BOTH isBlocking is true AND there's an active session
    // Use activeSessionId from message if provided, otherwise check storage
    (async () => {
      const activeSessionId = message.activeSessionId !== undefined 
        ? message.activeSessionId 
        : await new Promise((resolve) => {
            chrome.storage.local.get(['activeSessionId'], (result) => {
              resolve(result.activeSessionId);
            });
          });
      
      // Update blocked sites first
      blockedSites = message.blockedSites || [];
      
      // Check if we have blocked sites, time limits, or schedules
      const hasBlockedSites = blockedSites.length > 0;
      const hasTimeLimits = (message.timeLimits && message.timeLimits.length > 0);
      const hasSchedules = (message.activeSchedules && message.activeSchedules.length > 0);
      
      // CRITICAL: Only activate blocking if we have an active session AND blocking is enabled AND we have something to block
      // If we don't have blocked sites, time limits, or schedules, FORCE blocking to be disabled
      isBlockingActive = message.isBlocking === true && 
                        !!activeSessionId && 
                        (hasBlockedSites || hasTimeLimits || hasSchedules);
      
      // Safety check: If no blocked sites and no time limits/schedules, disable blocking
      if (!hasBlockedSites && !hasTimeLimits && !hasSchedules) {
        isBlockingActive = false;
        console.log('⚠️ CRITICAL: No blocked sites, time limits, or schedules - FORCING blocking to disabled');
      }
      
      console.log('🔒 Blocking state updated:', {
        isBlocking: message.isBlocking,
        activeSessionId: activeSessionId,
        hasActiveSession: !!activeSessionId,
        isBlockingActive: isBlockingActive,
        blockedSitesCount: blockedSites.length,
        blockedSites: blockedSites,
        hasTimeLimits: hasTimeLimits,
        hasSchedules: hasSchedules,
        willBlock: isBlockingActive && hasBlockedSites ? 'Only sites in blocked list' : (isBlockingActive ? 'Time limits/schedules only' : 'Nothing - disabled')
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
    })();
    
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
