import { useEffect, useState } from 'react';
import { Shield, Play, Square, LogOut, Loader2, Zap, Trophy, Flame } from 'lucide-react';
import useAuthStore from '../stores/authStore';
import { getToken } from '../services/authService';
import { postTokenToExtension, notifyExtensionSync } from '../services/extensionService';
import { createFocusSession, endFocusSession, getActiveFocusSessions } from '../services/focusSessionService';

// Custom styles for scrollbar
const scrollbarStyles = `
  .popup-container::-webkit-scrollbar {
    width: 6px;
  }
  .popup-container::-webkit-scrollbar-track {
    background: #0f172a;
    border-radius: 10px;
  }
  .popup-container::-webkit-scrollbar-thumb {
    background: #334155;
    border-radius: 10px;
  }
  .popup-container::-webkit-scrollbar-thumb:hover {
    background: #475569;
  }
`;

// Popup-specific styles (optimized for extension popup size)
const popupStyles = {
  container: {
    width: '380px',
    minHeight: '600px',
    maxHeight: '600px',
    overflowY: 'auto',
    overflowX: 'hidden',
    borderRadius: '16px', // Curved outer border
  }
};

function PopupPage() {
  const { user, isLoading, fetchUser, logout } = useAuthStore();
  const [activeSession, setActiveSession] = useState(null);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);

  // Initialize popup once on mount
  useEffect(() => {
    let isMounted = true;

    const initialize = async () => {
      try {
        // Fetch user if not loaded
        if (!user) {
          await fetchUser();
        }

        // Sync token with extension (only once, no retries to avoid rate limiting)
        const token = getToken();
        if (token) {
          postTokenToExtension(token);
        }

        // Notify extension that popup is ready
        if (isMounted) {
          if (window.parent !== window) {
            window.parent.postMessage({ type: 'FOCUS_BLOCKER_POPUP_READY' }, '*');
          }
          window.postMessage({ type: 'FOCUS_BLOCKER_POPUP_READY' }, '*');
        }
      } catch (error) {
        console.error('Popup initialization error:', error);
      } finally {
        if (isMounted) {
          setInitializing(false);
        }
      }
    };

    initialize();

    return () => {
      isMounted = false;
    };
  }, []); // Only run once on mount

  // Check for active session and periodically refresh (with rate limit protection)
  useEffect(() => {
    if (!user?._id) return;

    let timeoutId = null;
    let intervalId = null;
    let retryTimeoutId = null;
    let retryCount = 0;
    const MAX_RETRIES = 2;

    const checkSession = async () => {
      try {
        const activeSessions = await getActiveFocusSessions(user._id);
        const newActiveSession = activeSessions.length > 0 ? activeSessions[0] : null;
        
        // Update session state
        setActiveSession(prevSession => {
          const prevId = prevSession?._id || prevSession?.id;
          const newId = newActiveSession?._id || newActiveSession?.id;
          // Only update if actually changed
          if (prevId !== newId) {
            return newActiveSession;
          }
          return prevSession;
        });
        
        retryCount = 0; // Reset retry count on success
      } catch (error) {
        // Handle rate limiting or other errors gracefully
        if (error.message.includes('429') || error.message.includes('Too many requests')) {
          console.warn('Rate limited, will retry later');
          // Only retry if we haven't exceeded max retries
          if (retryCount < MAX_RETRIES) {
            retryCount++;
            // Exponential backoff: 30 seconds, then 60 seconds
            const delay = retryCount === 1 ? 30000 : 60000;
            retryTimeoutId = setTimeout(() => {
              checkSession();
            }, delay);
          } else {
            console.warn('Max retries reached for session check, giving up');
          }
        } else {
          console.warn('Failed to fetch active sessions:', error);
        }
      }
    };

    // Initial check with small delay to avoid immediate rate limiting
    timeoutId = setTimeout(checkSession, 2000);

    // Then check every 60 seconds (reduced frequency to avoid rate limiting)
    intervalId = setInterval(checkSession, 60000);

    // Also check when popup becomes visible (if in iframe)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkSession();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
      if (retryTimeoutId) clearTimeout(retryTimeoutId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user?._id]); // Check whenever user ID changes

  // Listen for token requests and session sync messages from extension
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data.type === 'FOCUS_BLOCKER_REQUEST_TOKEN') {
        const token = getToken();
        if (token) {
          postTokenToExtension(token);
        }
      }
      
      // Listen for session sync requests
      if (event.data.type === 'FOCUS_BLOCKER_SYNC_SESSION') {
        if (user?._id) {
          // Refresh active session when requested
          getActiveFocusSessions(user._id)
            .then(sessions => {
              if (sessions.length > 0) {
                setActiveSession(sessions[0]);
              } else {
                setActiveSession(null);
              }
            })
            .catch(err => {
              // Silently handle errors
              if (!err.message?.includes('429') && !err.message?.includes('Too many requests')) {
                console.warn('Failed to sync session:', err);
              }
            });
        }
      }
      
      // Listen for extension session updates (when session started/ended from extension)
      if (event.data.type === 'FOCUS_BLOCKER_EXTENSION_SESSION_UPDATE') {
        console.log('🔄 Received session update from extension:', event.data.sessionAction);
        
        if (user?._id) {
          // Immediately check for active sessions from backend
          getActiveFocusSessions(user._id)
            .then(sessions => {
              if (sessions.length > 0) {
                setActiveSession(sessions[0]);
                console.log('✅ Session synced from extension:', sessions[0]._id || sessions[0].id);
              } else {
                setActiveSession(null);
                console.log('✅ No active session (synced from extension)');
              }
            })
            .catch(err => {
              if (!err.message?.includes('429') && !err.message?.includes('Too many requests')) {
                console.warn('Failed to sync session from extension:', err);
              }
            });
        }
      }
    };

    // Listen for localStorage changes (cross-tab sync)
    const handleStorageChange = (e) => {
      if (e.key === 'focus_session_changed' && user?._id) {
        // Another tab changed the session, refresh
        getActiveFocusSessions(user._id)
          .then(sessions => {
            setActiveSession(sessions.length > 0 ? sessions[0] : null);
          })
          .catch(() => {
            // Ignore errors
          });
      }
    };

    window.addEventListener('message', handleMessage);
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('message', handleMessage);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [user?._id]);

  const handleStartSession = async () => {
    if (!user?._id) return;

    setSessionLoading(true);
    try {
      const session = await createFocusSession(user._id);
      setActiveSession(session);
      
      // Notify extension
      if (window.parent !== window) {
        window.parent.postMessage({ 
          type: 'FOCUS_BLOCKER_SESSION_STARTED',
          sessionId: session._id || session.id
        }, '*');
      }
      // Also notify via postMessage
      window.postMessage({ 
        type: 'FOCUS_BLOCKER_SESSION_STARTED',
        sessionId: session._id || session.id
      }, '*');
      
      // Sync with extension
      notifyExtensionSync('focusSession');
      
      // Notify other tabs/pages about session change
      localStorage.setItem('focus_session_changed', Date.now().toString());
      setTimeout(() => localStorage.removeItem('focus_session_changed'), 100);
      
      // Force a refresh check after a short delay to ensure sync
      setTimeout(async () => {
        try {
          const activeSessions = await getActiveFocusSessions(user._id);
          if (activeSessions.length > 0) {
            setActiveSession(activeSessions[0]);
          }
        } catch {
          // Ignore errors in refresh check
        }
      }, 2000);
    } catch (error) {
      console.error('Failed to start session:', error);
      // Better error message for rate limiting
      if (error.message.includes('429') || error.message.includes('Too many requests')) {
        alert('Too many requests. Please wait a moment and try again.');
      } else {
        alert('Failed to start focus session: ' + error.message);
      }
    } finally {
      setSessionLoading(false);
    }
  };

  const handleEndSession = async () => {
    if (!activeSession?._id) return;

    setSessionLoading(true);
    try {
      await endFocusSession(activeSession._id, 0);
      setActiveSession(null);
      await fetchUser(); // Refresh user stats
      
      // Notify extension
      if (window.parent !== window) {
        window.parent.postMessage({ 
          type: 'FOCUS_BLOCKER_SESSION_ENDED'
        }, '*');
      }
      // Also notify via postMessage
      window.postMessage({ 
        type: 'FOCUS_BLOCKER_SESSION_ENDED'
      }, '*');
      
      // Sync with extension
      notifyExtensionSync('focusSession');
      
      // Notify other tabs/pages about session change
      localStorage.setItem('focus_session_changed', Date.now().toString());
      setTimeout(() => localStorage.removeItem('focus_session_changed'), 100);
      
      // Force a refresh check after a short delay to ensure sync
      setTimeout(async () => {
        try {
          const activeSessions = await getActiveFocusSessions(user._id);
          setActiveSession(activeSessions.length > 0 ? activeSessions[0] : null);
        } catch {
          // Ignore errors in refresh check
        }
      }, 2000);
    } catch (error) {
      console.error('Failed to end session:', error);
      alert('Failed to end focus session: ' + error.message);
    } finally {
      setSessionLoading(false);
    }
  };

  const handleLogout = () => {
    if (activeSession) {
      if (!confirm("You have an active focus session. Are you sure you want to logout?")) {
        return;
      }
    }
    logout();
    
    // Notify extension
    if (window.parent !== window) {
      window.parent.postMessage({ type: 'FOCUS_BLOCKER_LOGOUT' }, '*');
    }
  };

  if (initializing || isLoading) {
    return (
      <>
        <style>{scrollbarStyles}</style>
        <div className="flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100 overflow-hidden rounded-2xl popup-container" style={popupStyles.container}>
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-slate-800/90 to-slate-800/70 border border-emerald-500/20 flex items-center justify-center shadow-xl">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
          </div>
          <p className="text-sm text-slate-400 font-medium">Syncing with your account...</p>
        </div>
      </div>
      </>
    );
  }

  if (!user) {
    return (
      <>
        <style>{scrollbarStyles}</style>
        <div className="flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100 px-4 overflow-hidden rounded-2xl popup-container" style={popupStyles.container}>
          <div className="w-full text-center">
            <div className="mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-slate-800/90 to-slate-800/70 border border-emerald-500/20 flex items-center justify-center shadow-xl">
                <Shield className="w-8 h-8 text-emerald-400" />
              </div>
              <h1 className="text-2xl font-bold mb-2 bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">Welcome back</h1>
              <p className="text-slate-400 text-sm font-medium">Sign in to continue your focus streak.</p>
            </div>
            
            <div className="bg-gradient-to-br from-slate-800/90 to-slate-800/70 border border-emerald-500/20 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
              <button
                onClick={() => {
                  // Open login in parent window or new tab
                  if (window.parent !== window) {
                    window.parent.postMessage({ type: 'FOCUS_BLOCKER_OPEN_LOGIN' }, '*');
                  } else {
                    window.location.href = '/login';
                  }
                }}
                className="w-full rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-600 hover:from-emerald-500 hover:via-emerald-400 hover:to-emerald-500 px-4 py-3.5 text-sm font-bold text-white transition-all flex items-center justify-center gap-2 shadow-xl hover:shadow-2xl hover:shadow-emerald-500/30 hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                <span className="relative z-10">→</span>
                <span className="relative z-10">Login / Register</span>
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{scrollbarStyles}</style>
      <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100 overflow-hidden rounded-2xl popup-container" style={popupStyles.container}>
      {/* Header with gradient */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-800/90 border-b border-emerald-500/20 px-4 py-3.5 rounded-t-2xl backdrop-blur-sm">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <Shield className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="font-bold text-sm bg-gradient-to-r from-emerald-400 to-emerald-300 bg-clip-text text-transparent">AI Focus Blocker</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* User Welcome with gradient */}
        <div className="bg-gradient-to-br from-slate-800/90 to-slate-800/70 border border-emerald-500/20 rounded-2xl p-4 flex items-center gap-3 shadow-xl backdrop-blur-sm hover:border-emerald-500/30 transition-all">
          <div className="relative">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 flex items-center justify-center text-emerald-400 text-xl shadow-lg border border-emerald-500/20">
              👤
            </div>
            <div className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-emerald-500 rounded-full border-2 border-slate-800"></div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-slate-400 mb-0.5 font-medium">Welcome back,</div>
            <div className="font-bold text-sm truncate bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">{user.name || user.email}</div>
          </div>
        </div>

        {/* Gamification Stats with icons */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-gradient-to-br from-slate-800/90 to-slate-800/70 border border-emerald-500/20 rounded-2xl p-3.5 text-center shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all group cursor-default">
            <div className="flex items-center justify-center mb-2">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 group-hover:bg-emerald-500/20 transition-colors">
                <Zap className="w-3.5 h-3.5 text-emerald-400" />
              </div>
            </div>
            <div className="text-[10px] text-slate-400 mb-1 uppercase tracking-wider font-semibold">Level</div>
            <div className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-emerald-300 bg-clip-text text-transparent">{user.level || 1}</div>
          </div>
          <div className="bg-gradient-to-br from-slate-800/90 to-slate-800/70 border border-emerald-500/20 rounded-2xl p-3.5 text-center shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all group cursor-default">
            <div className="flex items-center justify-center mb-2">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 group-hover:bg-emerald-500/20 transition-colors">
                <Trophy className="w-3.5 h-3.5 text-emerald-400" />
              </div>
            </div>
            <div className="text-[10px] text-slate-400 mb-1 uppercase tracking-wider font-semibold">XP</div>
            <div className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-emerald-300 bg-clip-text text-transparent">{user.xp || 0}</div>
          </div>
          <div className="bg-gradient-to-br from-slate-800/90 to-slate-800/70 border border-emerald-500/20 rounded-2xl p-3.5 text-center shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all group cursor-default">
            <div className="flex items-center justify-center mb-2">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 group-hover:bg-emerald-500/20 transition-colors">
                <Flame className="w-3.5 h-3.5 text-emerald-400" />
              </div>
            </div>
            <div className="text-[10px] text-slate-400 mb-1 uppercase tracking-wider font-semibold">Streak</div>
            <div className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-emerald-300 bg-clip-text text-transparent">{user.streak || 0}</div>
          </div>
        </div>

        {/* Status Card with animated gradient */}
        <div className={`bg-gradient-to-br ${activeSession ? 'from-emerald-500/10 to-emerald-600/5' : 'from-slate-800/90 to-slate-800/70'} border ${activeSession ? 'border-emerald-500/30' : 'border-slate-700/50'} rounded-2xl p-4 text-center relative shadow-xl overflow-hidden backdrop-blur-sm`}>
          <div className={`absolute top-0 left-0 right-0 h-1.5 rounded-t-2xl ${
            activeSession ? 'bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-500 animate-pulse' : 'bg-gradient-to-r from-slate-600 to-slate-500'
          }`}></div>
          <div className="flex items-center justify-center gap-2 mt-1">
            {activeSession && (
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
            )}
            <p className={`text-sm font-bold ${activeSession ? 'text-emerald-300' : 'text-slate-300'}`}>
              {activeSession ? '🔥 Focus Session Active' : 'Ready to Focus'}
            </p>
            {activeSession && (
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
            )}
          </div>
        </div>

        {/* Action Buttons with gradient */}
        <div className="space-y-2.5">
          {!activeSession ? (
            <button
              onClick={handleStartSession}
              disabled={sessionLoading}
              className="w-full rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-600 hover:from-emerald-500 hover:via-emerald-400 hover:to-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed px-4 py-3.5 text-sm font-bold text-white transition-all flex items-center justify-center gap-2.5 shadow-xl hover:shadow-2xl hover:shadow-emerald-500/30 hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
              {sessionLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin relative z-10" />
                  <span className="relative z-10">Starting...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 relative z-10" />
                  <span className="relative z-10">Start Focus</span>
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleEndSession}
              disabled={sessionLoading}
              className="w-full rounded-2xl bg-gradient-to-r from-red-600 via-red-500 to-red-600 hover:from-red-500 hover:via-red-400 hover:to-red-500 disabled:opacity-60 disabled:cursor-not-allowed px-4 py-3.5 text-sm font-bold text-white transition-all flex items-center justify-center gap-2.5 shadow-xl hover:shadow-2xl hover:shadow-red-500/30 hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
              {sessionLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin relative z-10" />
                  <span className="relative z-10">Ending...</span>
                </>
              ) : (
                <>
                  <Square className="w-4 h-4 relative z-10" />
                  <span className="relative z-10">End Session</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-slate-700">
          <button
            onClick={handleLogout}
            className="w-full text-sm text-slate-400 hover:text-slate-200 py-2 transition-colors flex items-center justify-center gap-2 rounded-xl hover:bg-slate-800/50"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>
      </div>
    </>
  );
}

export default PopupPage;
