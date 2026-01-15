import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, useChallengeStore, useSettingsStore, useUIStore } from '../stores';
import ChallengeSettings from '../components/settings/ChallengeSettings';
import { 
  Trophy, ArrowLeft, TrendingUp, Target, Zap, Clock, 
  CheckCircle, XCircle, History, Timer, X, Calendar
} from 'lucide-react';

function ChallengesPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  // Challenge Store
  const {
    challenges,
    activeUnlocks,
    stats,
    isLoading: challengeLoading,
    fetchChallenges,
    fetchStats,
    fetchActiveUnlocks,
    revokeUnlock: revokeUnlockAction
  } = useChallengeStore();
  
  // Settings Store
  const {
    userSettings,
    isLoading: settingsLoading,
    fetchSettings,
    updateSettings,
    createSettings
  } = useSettingsStore();
  
  // UI Store
  const {
    successMessage,
    errorMessage,
    setSuccessMessage,
    setErrorMessage
  } = useUIStore();
  
  const [activeTab, setActiveTab] = useState('overview');
  const loading = challengeLoading || settingsLoading;

  useEffect(() => {
    if (user?._id) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      // Load all data in parallel
      await Promise.all([
        fetchSettings(user._id).catch(() => console.debug('User settings not found')),
        fetchStats().catch(() => console.debug('Stats not available')),
        fetchChallenges(user._id, { limit: 10 }).catch(() => console.debug('Challenges not available')),
        fetchActiveUnlocks().catch(() => console.debug('Unlocks not available'))
      ]);
    } catch (err) {
      console.error('Error loading data:', err);
    }
  };

  const handleSaveChallengeSettings = async (challengeSettings) => {
    try {
      if (userSettings) {
        await updateSettings(user._id, challengeSettings);
      } else {
        await createSettings(user._id, challengeSettings);
      }
      setSuccessMessage('Challenge settings saved successfully!');
    } catch (err) {
      throw new Error(err.message || 'Failed to save challenge settings');
    }
  };

  const handleRevokeUnlock = async (unlockId) => {
    try {
      await revokeUnlockAction(unlockId);
      setSuccessMessage('Unlock revoked successfully!');
    } catch (err) {
      setErrorMessage(err.message || 'Failed to revoke unlock');
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const getTimeRemaining = (expiresAt) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry - now;
    
    if (diff <= 0) return 'Expired';
    
    const minutes = Math.floor(diff / 1000 / 60);
    const seconds = Math.floor((diff / 1000) % 60);
    return `${minutes}m ${seconds}s`;
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'history', label: 'History', icon: History },
    { id: 'settings', label: 'Settings', icon: Target },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2 text-slate-400 hover:text-slate-200 transition-colors"
              >
                <ArrowLeft size={20} />
                Back to Dashboard
              </button>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30">
                <Trophy className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Challenges</h1>
                <p className="text-xs text-slate-400">Unlock sites by completing challenges</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success/Error Messages */}
        {successMessage && (
          <div className="mb-6 flex items-center gap-2 p-4 bg-emerald-900/30 border border-emerald-700 rounded-lg text-emerald-300">
            <CheckCircle size={20} />
            {successMessage}
          </div>
        )}
        
        {errorMessage && (
          <div className="mb-6 p-4 bg-red-900/30 border border-red-700 rounded-lg text-red-300">
            {errorMessage}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-2 sticky top-4">
              {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      activeTab === tab.id
                        ? 'bg-purple-600/20 text-purple-400 border border-purple-700/50'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`}
                  >
                    <Icon size={18} />
                    <span className="text-sm font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content Area */}
          <div className="lg:col-span-3">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-3">
                      <div className="p-2 rounded-lg bg-blue-500/20">
                        <Target className="w-5 h-5 text-blue-400" />
                      </div>
                      <span className="text-xs text-slate-500 uppercase font-semibold">Total</span>
                    </div>
                    <div className="text-3xl font-bold text-slate-100">
                      {stats?.total || 0}
                    </div>
                    <p className="text-sm text-slate-400 mt-1">Challenges Attempted</p>
                  </div>

                  <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-3">
                      <div className="p-2 rounded-lg bg-green-500/20">
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      </div>
                      <span className="text-xs text-slate-500 uppercase font-semibold">Rate</span>
                    </div>
                    <div className="text-3xl font-bold text-green-400">
                      {stats?.successRate || 0}%
                    </div>
                    <p className="text-sm text-slate-400 mt-1">Success Rate</p>
                  </div>

                  <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-3">
                      <div className="p-2 rounded-lg bg-yellow-500/20">
                        <Zap className="w-5 h-5 text-yellow-400" />
                      </div>
                      <span className="text-xs text-slate-500 uppercase font-semibold">Total</span>
                    </div>
                    <div className="text-3xl font-bold text-yellow-400">
                      {stats?.totalXP || 0}
                    </div>
                    <p className="text-sm text-slate-400 mt-1">XP Earned</p>
                  </div>
                </div>

                {/* Challenge Type Breakdown */}
                {stats?.byType && Object.keys(stats.byType).length > 0 && (
                  <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-slate-100 mb-4">Challenge Breakdown</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {Object.entries(stats.byType).map(([type, data]) => {
                        const icons = {
                          math: '🔢',
                          memory: '🧠',
                          typing: '⌨️',
                          exercise: '💪',
                          breathing: '🧘',
                          reaction: '⚡'
                        };
                        const successRate = data.total > 0 
                          ? Math.round((data.successful / data.total) * 100) 
                          : 0;
                        
                        return (
                          <div key={type} className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-2xl">{icons[type]}</span>
                              <span className="text-sm font-semibold text-slate-200 capitalize">{type}</span>
                            </div>
                            <div className="space-y-1">
                              <div className="flex justify-between text-xs">
                                <span className="text-slate-400">Attempts:</span>
                                <span className="text-slate-200 font-semibold">{data.total}</span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-slate-400">Success:</span>
                                <span className="text-green-400 font-semibold">{successRate}%</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Active Unlocks */}
                <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                      <Timer className="w-5 h-5 text-emerald-400" />
                      Active Unlocks
                    </h3>
                    <span className="px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-semibold">
                      {activeUnlocks.length} Active
                    </span>
                  </div>

                  {activeUnlocks.length === 0 ? (
                    <div className="text-center py-8">
                      <Timer className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                      <p className="text-slate-400">No active unlocks</p>
                      <p className="text-sm text-slate-500 mt-1">Complete challenges to unlock blocked sites</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {activeUnlocks.map((unlock) => (
                        <div key={unlock._id} className="bg-gradient-to-r from-emerald-500/10 to-emerald-500/5 border border-emerald-500/30 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold text-slate-100">{unlock.domain}</h4>
                                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-xs font-semibold">
                                  Active
                                </span>
                              </div>
                              <div className="flex items-center gap-4 text-xs text-slate-400">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  Expires: {new Date(unlock.expiresAt).toLocaleTimeString()}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Timer className="w-3 h-3" />
                                  {getTimeRemaining(unlock.expiresAt)} remaining
                                </span>
                              </div>
                            </div>
                            <button
                              onClick={() => handleRevokeUnlock(unlock._id)}
                              className="p-2 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                              title="Revoke unlock"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recent Activity */}
                <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
                    <History className="w-5 h-5 text-blue-400" />
                    Recent Activity
                  </h3>

                  {challenges.length === 0 ? (
                    <div className="text-center py-8">
                      <Trophy className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                      <p className="text-slate-400">No challenges yet</p>
                      <p className="text-sm text-slate-500 mt-1">Start a focus session and try to access a blocked site</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {challenges.slice(0, 5).map((challenge) => (
                        <div key={challenge._id} className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {challenge.success ? (
                                <div className="p-1.5 rounded bg-green-500/20">
                                  <CheckCircle className="w-4 h-4 text-green-400" />
                                </div>
                              ) : (
                                <div className="p-1.5 rounded bg-red-500/20">
                                  <XCircle className="w-4 h-4 text-red-400" />
                                </div>
                              )}
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-semibold text-slate-200 capitalize">{challenge.type}</span>
                                  <span className="text-xs text-slate-500">•</span>
                                  <span className="text-xs text-slate-400">Level {challenge.difficulty}</span>
                                </div>
                                <p className="text-xs text-slate-500">
                                  {challenge.domain} • {formatDuration(challenge.timeTaken)}
                                </p>
                              </div>
                            </div>
                            {challenge.success && (
                              <div className="text-right">
                                <div className="text-sm font-bold text-yellow-400">+{challenge.xpAwarded} XP</div>
                                <div className="text-xs text-slate-500">{challenge.unlockDuration}m unlock</div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* History Tab */}
            {activeTab === 'history' && (
              <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-6">
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  <History className="w-6 h-6 text-blue-400" />
                  Challenge History
                </h2>

                {challenges.length === 0 ? (
                  <div className="text-center py-12">
                    <Trophy className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                    <p className="text-lg text-slate-400 mb-2">No challenges yet</p>
                    <p className="text-sm text-slate-500">Complete challenges to see your history here</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {challenges.map((challenge) => (
                      <div key={challenge._id} className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 hover:border-slate-600 transition-colors">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            {challenge.success ? (
                              <div className="p-2 rounded-lg bg-green-500/20">
                                <CheckCircle className="w-5 h-5 text-green-400" />
                              </div>
                            ) : (
                              <div className="p-2 rounded-lg bg-red-500/20">
                                <XCircle className="w-5 h-5 text-red-400" />
                              </div>
                            )}
                            <div>
                              <h3 className="font-semibold text-slate-100 capitalize">{challenge.type} Challenge</h3>
                              <p className="text-sm text-slate-400">Level {challenge.difficulty}</p>
                            </div>
                          </div>
                          {challenge.success && (
                            <div className="text-right">
                              <div className="text-lg font-bold text-yellow-400">+{challenge.xpAwarded} XP</div>
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                          <div className="bg-slate-900/50 rounded-lg p-2">
                            <p className="text-slate-500 mb-1">Domain</p>
                            <p className="text-slate-200 font-semibold truncate">{challenge.domain}</p>
                          </div>
                          <div className="bg-slate-900/50 rounded-lg p-2">
                            <p className="text-slate-500 mb-1">Time Taken</p>
                            <p className="text-slate-200 font-semibold">{formatDuration(challenge.timeTaken)}</p>
                          </div>
                          <div className="bg-slate-900/50 rounded-lg p-2">
                            <p className="text-slate-500 mb-1">Status</p>
                            <p className={`font-semibold ${challenge.success ? 'text-green-400' : 'text-red-400'}`}>
                              {challenge.success ? 'Success' : 'Failed'}
                            </p>
                          </div>
                          <div className="bg-slate-900/50 rounded-lg p-2">
                            <p className="text-slate-500 mb-1 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Date
                            </p>
                            <p className="text-slate-200 font-semibold">{new Date(challenge.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-6">
                <h2 className="text-xl font-semibold mb-6">Challenge Settings</h2>
                <ChallengeSettings
                  settings={userSettings}
                  onSave={handleSaveChallengeSettings}
                  onCancel={() => {}}
                />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default ChallengesPage;
