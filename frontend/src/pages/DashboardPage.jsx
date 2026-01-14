import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../stores/authStore';
import { getUserFocusSessions, calculateSessionStats, createFocusSession, endFocusSession, getActiveFocusSessions } from '../services/focusSessionService';
import { getUserAchievements } from '../services/achievementService';
import { getUserBlockedSites } from '../services/blockedSiteService';
import { LogOut, User, Zap, Target, TrendingUp, Award, Shield, Play, Square, Flame, Settings, BarChart3, Clock, Calendar, FileText } from 'lucide-react';

function DashboardPage() {
  const navigate = useNavigate();
  const { user, isLoading, error, fetchUser, logout } = useAuthStore();
  
  const [sessions, setSessions] = useState([]);
  const [stats, setStats] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [blockedSites, setBlockedSites] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    // Fetch user data if not already loaded
    if (!user) {
      fetchUser().catch(() => {
        // If fetch fails, user will be redirected by ProtectedRoute
      });
    }
  }, [user, fetchUser]);

  useEffect(() => {
    // Fetch all dashboard data when user is available
    if (user?._id) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    if (!user?._id) return;
    
    setDataLoading(true);
    try {
      // Fetch all data in parallel
      const [sessionsData, achievementsData, blockedSitesData, activeSessionsData] = await Promise.all([
        getUserFocusSessions(user._id).catch(() => []),
        getUserAchievements(user._id).catch(() => []),
        getUserBlockedSites(user._id).catch(() => []),
        getActiveFocusSessions(user._id).catch(() => []),
      ]);

      setSessions(sessionsData);
      setStats(calculateSessionStats(sessionsData));
      setAchievements(achievementsData);
      setBlockedSites(blockedSitesData);
      setActiveSession(activeSessionsData.length > 0 ? activeSessionsData[0] : null);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setDataLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleStartFocus = async () => {
    try {
      const session = await createFocusSession(user._id);
      setActiveSession(session);
      await loadDashboardData();
    } catch (err) {
      console.error('Failed to start focus session:', err);
      alert('Failed to start focus session: ' + err.message);
    }
  };

  const handleEndFocus = async () => {
    if (!activeSession?._id) return;
    
    try {
      await endFocusSession(activeSession._id, 0);
      setActiveSession(null);
      // Refetch user to get updated XP, level, streak
      await fetchUser();
      await loadDashboardData();
    } catch (err) {
      console.error('Failed to end focus session:', err);
      alert('Failed to end focus session: ' + err.message);
    }
  };

  // Calculate level progress
  const calculateLevelProgress = (xp, level) => {
    // Simple level calculation: level = floor(XP / 100) + 1
    // XP needed for current level: (level - 1) * 100
    // XP needed for next level: level * 100
    const xpForCurrentLevel = (level - 1) * 100;
    const xpForNextLevel = level * 100;
    const xpInCurrentLevel = xp - xpForCurrentLevel;
    const xpNeededForNextLevel = xpForNextLevel - xpForCurrentLevel;
    const progress = (xpInCurrentLevel / xpNeededForNextLevel) * 100;
    
    return {
      current: xpInCurrentLevel,
      needed: xpNeededForNextLevel,
      percentage: Math.min(Math.max(progress, 0), 100),
    };
  };

  if (isLoading || dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100">
        <div className="text-center">
          <div className="text-red-400 mb-4">{error}</div>
          <button
            onClick={handleLogout}
            className="text-emerald-500 hover:text-emerald-400"
          >
            Return to login
          </button>
        </div>
      </div>
    );
  }

  const levelProgress = user ? calculateLevelProgress(user.xp || 0, user.level || 1) : null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 sticky top-0 z-10 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-semibold">🎯 AI Focus Blocker</h1>
            
            <div className="flex items-center gap-4">
              {user?.role === 'admin' && (
                <button
                  onClick={() => navigate('/admin')}
                  className="px-3 py-1 bg-purple-600/20 border border-purple-500 rounded-full text-xs font-medium text-purple-400 hover:bg-purple-600/30 transition-colors"
                >
                  <Shield size={14} className="inline mr-1" />
                  Admin Panel
                </button>
              )}
                <button
                  onClick={() => navigate('/blocked-sites')}
                  className="flex items-center gap-2 px-4 py-2 rounded-md bg-slate-800 hover:bg-slate-700 text-sm font-medium transition-colors"
                >
                  <Shield size={16} />
                  Blocked Sites
                </button>
                <button
                  onClick={() => navigate('/settings')}
                  className="flex items-center gap-2 px-4 py-2 rounded-md bg-slate-800 hover:bg-slate-700 text-sm font-medium transition-colors"
                >
                  <Settings size={16} />
                  Settings
                </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 rounded-md bg-slate-800 hover:bg-slate-700 text-sm font-medium transition-colors"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">
            Welcome back, {user?.name || 'User'}!
          </h2>
          <p className="text-slate-400">
            {activeSession ? '🔥 Focus session in progress' : 'Ready to boost your productivity?'}
          </p>
        </div>

        {/* Gamification Stats - Top Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Level & XP */}
          <div className="bg-gradient-to-br from-purple-900/40 to-purple-800/20 border border-purple-700/50 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="bg-purple-600/30 p-3 rounded-lg">
                  <Zap size={24} className="text-purple-400" />
                </div>
                <div>
                  <div className="text-sm text-purple-300">Level</div>
                  <div className="text-3xl font-bold text-purple-200">{user?.level || 1}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-purple-300">XP</div>
                <div className="text-2xl font-semibold text-purple-200">{user?.xp || 0}</div>
              </div>
            </div>
            {levelProgress && (
              <div>
                <div className="flex justify-between text-xs text-purple-300 mb-1">
                  <span>{levelProgress.current} XP</span>
                  <span>{levelProgress.needed} XP</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-purple-400 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${levelProgress.percentage}%` }}
                  />
                </div>
                <p className="text-xs text-purple-300 mt-2">
                  {Math.round(levelProgress.percentage)}% to Level {(user?.level || 1) + 1}
                </p>
              </div>
            )}
          </div>

          {/* Streak */}
          <div className="bg-gradient-to-br from-orange-900/40 to-orange-800/20 border border-orange-700/50 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-orange-600/30 p-3 rounded-lg">
                <Flame size={24} className="text-orange-400" />
              </div>
              <div>
                <div className="text-sm text-orange-300">Current Streak</div>
                <div className="text-3xl font-bold text-orange-200">{user?.streak || 0} days</div>
              </div>
            </div>
            <div className="flex justify-between items-center pt-4 border-t border-orange-700/30">
              <span className="text-sm text-orange-300">Longest Streak</span>
              <span className="text-lg font-semibold text-orange-200">{user?.longestStreak || 0} days</span>
            </div>
            <p className="text-xs text-orange-300 mt-3">
              {user?.streak > 0 
                ? `Keep focusing daily to maintain your streak!` 
                : 'Start a focus session to begin your streak!'}
            </p>
          </div>

          {/* Focus Sessions */}
          <div className="bg-gradient-to-br from-emerald-900/40 to-emerald-800/20 border border-emerald-700/50 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-emerald-600/30 p-3 rounded-lg">
                <Target size={24} className="text-emerald-400" />
              </div>
              <div>
                <div className="text-sm text-emerald-300">Total Sessions</div>
                <div className="text-3xl font-bold text-emerald-200">{stats?.totalSessions || 0}</div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-emerald-300">This Week</span>
                <span className="font-semibold text-emerald-200">{stats?.sessionsThisWeek || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-emerald-300">Total Hours</span>
                <span className="font-semibold text-emerald-200">{stats?.totalHours || 0}h</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions & Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Focus Session Control */}
          <div className="md:col-span-2 bg-slate-900/70 border border-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Play size={20} className="text-emerald-500" />
              Focus Session
            </h3>
            
            {activeSession ? (
              <div className="space-y-4">
                <div className="bg-emerald-900/30 border border-emerald-700/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-emerald-300">Session Active</span>
                    <span className="flex items-center gap-1 text-emerald-400 animate-pulse">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                      Live
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-emerald-200">
                    {new Date(activeSession.startTime).toLocaleTimeString()}
                  </p>
                  <p className="text-xs text-emerald-300 mt-1">Started</p>
                </div>
                
                <button
                  onClick={handleEndFocus}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-red-600 hover:bg-red-500 text-white font-medium transition-colors"
                >
                  <Square size={18} />
                  End Focus Session
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-slate-400 text-sm">
                  Start a focus session to block distracting websites and earn XP!
                </p>
                
                <button
                  onClick={handleStartFocus}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-colors"
                >
                  <Play size={18} />
                  Start Focus Session
                </button>

                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-700">
                  <div>
                    <div className="text-xs text-slate-400">Avg. Duration</div>
                    <div className="text-lg font-semibold">{stats?.averageMinutes || 0} min</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">Blocked Sites</div>
                    <div className="text-lg font-semibold">{blockedSites.length}</div>
                  </div>
                </div>

                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => navigate('/analytics')}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-colors"
                  >
                    <BarChart3 size={16} />
                    Analytics
                  </button>
                  <button
                    onClick={() => navigate('/usage-metrics')}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-colors"
                  >
                    <BarChart3 size={16} />
                    Usage Metrics
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <TrendingUp size={20} className="text-blue-500" />
              Quick Stats
            </h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-700">
                <span className="text-sm text-slate-400">Total Minutes</span>
                <span className="font-semibold text-blue-400">{stats?.totalMinutes || 0}</span>
              </div>
              
              <div className="flex justify-between items-center pb-3 border-b border-slate-700">
                <span className="text-sm text-slate-400">Distractions</span>
                <span className="font-semibold text-yellow-400">{stats?.totalDistractions || 0}</span>
              </div>
              
              <div className="flex justify-between items-center pb-3 border-b border-slate-700">
                <span className="text-sm text-slate-400">Achievements</span>
                <span className="font-semibold text-purple-400">{achievements.length}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Member Since</span>
                <span className="font-semibold text-slate-300">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="mb-8 bg-slate-900/70 border border-slate-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Settings size={20} className="text-emerald-500" />
            Quick Links
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button
              onClick={() => navigate('/blocked-sites')}
              className="flex flex-col items-center gap-2 p-4 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors border border-slate-700"
            >
              <Shield size={24} className="text-emerald-400" />
              <span className="text-sm font-medium">Blocked Sites</span>
            </button>
            <button
              onClick={() => navigate('/time-limits')}
              className="flex flex-col items-center gap-2 p-4 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors border border-slate-700"
            >
              <Clock size={24} className="text-blue-400" />
              <span className="text-sm font-medium">Time Limits</span>
            </button>
            <button
              onClick={() => navigate('/schedule')}
              className="flex flex-col items-center gap-2 p-4 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors border border-slate-700"
            >
              <Calendar size={24} className="text-purple-400" />
              <span className="text-sm font-medium">Schedule</span>
            </button>
            <button
              onClick={() => navigate('/custom-block-page')}
              className="flex flex-col items-center gap-2 p-4 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors border border-slate-700"
            >
              <FileText size={24} className="text-pink-400" />
              <span className="text-sm font-medium">Custom Block Page</span>
            </button>
          </div>
        </div>

        {/* Recent Sessions & Achievements */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Recent Sessions */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Target size={20} className="text-emerald-500" />
              Recent Sessions
            </h3>
            
            {sessions.length > 0 ? (
              <div className="space-y-3">
                {sessions.slice(0, 5).map((session, idx) => (
                  <div 
                    key={session._id || idx} 
                    className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    <div>
                      <div className="text-sm font-medium">
                        {session.duration ? `${session.duration} minutes` : 'In Progress'}
                      </div>
                      <div className="text-xs text-slate-400">
                        {new Date(session.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-right">
                      {session.distractions > 0 && (
                        <div className="text-xs text-yellow-400">
                          {session.distractions} distractions
                        </div>
                      )}
                      <div className="text-xs text-slate-500">{session.source}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400">
                <Target size={48} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">No focus sessions yet</p>
                <p className="text-xs mt-1">Start your first session to see it here!</p>
              </div>
            )}
          </div>

          {/* Achievements */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Award size={20} className="text-yellow-500" />
              Achievements
            </h3>
            
            {achievements.length > 0 ? (
              <div className="space-y-3">
                {achievements.slice(0, 5).map((achievement, idx) => (
                  <div 
                    key={achievement._id || idx} 
                    className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    <div className="text-2xl">{achievement.icon || '🏆'}</div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">{achievement.title}</div>
                      <div className="text-xs text-slate-400">{achievement.description}</div>
                      {achievement.unlockedAt && (
                        <div className="text-xs text-slate-500 mt-1">
                          {new Date(achievement.unlockedAt).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400">
                <Award size={48} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">No achievements unlocked yet</p>
                <p className="text-xs mt-1">Complete focus sessions to unlock badges!</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default DashboardPage;
