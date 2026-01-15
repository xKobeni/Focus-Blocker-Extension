import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, Loader, Play, RefreshCw } from 'lucide-react';
import { useAuthStore } from '../stores';
import * as blockedSiteService from '../services/blockedSiteService';
import * as focusSessionService from '../services/focusSessionService';
import * as timeLimitService from '../services/timeLimitService';
import * as scheduleService from '../services/scheduleService';
import * as challengeService from '../services/challengeService';
import * as achievementService from '../services/achievementService';
import * as usageMetricService from '../services/usageMetricService';
import * as customBlockPageService from '../services/customBlockPageService';
import * as userSettingsService from '../services/userSettingsService';

function ApiTestPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState({});
  const [currentTest, setCurrentTest] = useState('');

  const updateResult = (category, endpoint, status, message, data = null) => {
    setResults(prev => ({
      ...prev,
      [category]: {
        ...(prev[category] || {}),
        [endpoint]: { status, message, data, timestamp: new Date().toISOString() }
      }
    }));
  };

  const testEndpoint = async (category, name, testFn) => {
    setCurrentTest(`${category} - ${name}`);
    try {
      const result = await testFn();
      updateResult(category, name, 'success', 'Test passed', result);
      return true;
    } catch (error) {
      updateResult(category, name, 'error', error.message);
      return false;
    }
  };

  const runAllTests = async () => {
    if (!user?._id) {
      alert('Please login first to run API tests');
      return;
    }

    setTesting(true);
    setResults({});
    
    try {
      // Test Blocked Sites API
      await testEndpoint('Blocked Sites', 'GET /blocked-sites', async () => {
        return await blockedSiteService.getUserBlockedSites(user._id);
      });

      await testEndpoint('Blocked Sites', 'POST /blocked-sites', async () => {
        return await blockedSiteService.createBlockedSite({
          userId: user._id,
          url: 'test-site.com',
          category: 'test',
          isActive: true
        });
      });

      // Test Focus Sessions API
      await testEndpoint('Focus Sessions', 'GET /focus-sessions', async () => {
        return await focusSessionService.getUserFocusSessions(user._id);
      });

      await testEndpoint('Focus Sessions', 'GET /active-sessions', async () => {
        return await focusSessionService.getActiveFocusSessions(user._id);
      });

      await testEndpoint('Focus Sessions', 'POST /focus-sessions', async () => {
        return await focusSessionService.createFocusSession(user._id);
      });

      // Test Time Limits API
      await testEndpoint('Time Limits', 'GET /time-limits', async () => {
        return await timeLimitService.getUserTimeLimits(user._id);
      });

      await testEndpoint('Time Limits', 'POST /time-limits', async () => {
        return await timeLimitService.createTimeLimit({
          userId: user._id,
          domain: 'test-limit.com',
          url: 'https://test-limit.com',
          dailyLimitMinutes: 30,
          action: 'block',
          isActive: true
        });
      });

      // Test Schedules API
      await testEndpoint('Schedules', 'GET /schedules', async () => {
        return await scheduleService.getUserSchedules(user._id);
      });

      await testEndpoint('Schedules', 'GET /active-schedules', async () => {
        return await scheduleService.getActiveSchedules(user._id);
      });

      await testEndpoint('Schedules', 'POST /schedules', async () => {
        return await scheduleService.createSchedule({
          userId: user._id,
          name: 'Test Schedule',
          daysOfWeek: [1, 2, 3],
          startTime: '09:00',
          endTime: '17:00',
          action: 'block_all',
          isActive: true
        });
      });

      // Test Challenges API
      await testEndpoint('Challenges', 'GET /challenges/stats', async () => {
        return await challengeService.getChallengeStats();
      });

      await testEndpoint('Challenges', 'GET /challenges/user', async () => {
        return await challengeService.getUserChallenges(user._id);
      });

      await testEndpoint('Challenges', 'POST /challenges/generate', async () => {
        return await challengeService.generateChallenge(user._id, 'test.com', 'math');
      });

      await testEndpoint('Challenges', 'GET /temporary-unlocks/active', async () => {
        return await challengeService.getActiveUnlocks();
      });

      // Test Achievements API
      await testEndpoint('Achievements', 'GET /achievements', async () => {
        return await achievementService.getAllAchievements();
      });

      await testEndpoint('Achievements', 'GET /achievements/user', async () => {
        return await achievementService.getUserAchievements(user._id);
      });

      await testEndpoint('Achievements', 'POST /achievements/check', async () => {
        return await achievementService.checkUserAchievements(user._id);
      });

      // Test Usage Metrics API
      await testEndpoint('Usage Metrics', 'GET /usage-metrics', async () => {
        return await usageMetricService.getUserUsageMetrics(user._id);
      });

      await testEndpoint('Usage Metrics', 'GET /usage-statistics', async () => {
        return await usageMetricService.getUsageStatistics(user._id);
      });

      await testEndpoint('Usage Metrics', 'POST /usage-metrics', async () => {
        return await usageMetricService.recordUsage({
          userId: user._id,
          domain: 'test.com',
          duration: 100,
          category: 'test'
        });
      });

      // Test Custom Block Page API
      await testEndpoint('Custom Block Page', 'GET /custom-block-page', async () => {
        return await customBlockPageService.getCustomBlockPage(user._id);
      });

      await testEndpoint('Custom Block Page', 'PUT /custom-block-page', async () => {
        return await customBlockPageService.upsertCustomBlockPage(user._id, {
          title: 'Test Block Page',
          message: 'Test message',
          backgroundColor: '#000000',
          textColor: '#ffffff'
        });
      });

      // Test User Settings API
      await testEndpoint('User Settings', 'GET /user-settings', async () => {
        return await userSettingsService.getUserSettings(user._id);
      });

      await testEndpoint('User Settings', 'PUT /user-settings', async () => {
        return await userSettingsService.updateUserSettings(user._id, {
          challengeSettings: {
            enabled: true,
            difficulty: 'medium'
          }
        });
      });

    } catch (error) {
      console.error('Test suite error:', error);
    } finally {
      setTesting(false);
      setCurrentTest('');
    }
  };

  const getStatusIcon = (status) => {
    if (status === 'success') return <CheckCircle className="text-green-500" size={20} />;
    if (status === 'error') return <XCircle className="text-red-500" size={20} />;
    return <Loader className="text-blue-500 animate-spin" size={20} />;
  };

  const getStatusColor = (status) => {
    if (status === 'success') return 'bg-green-900/30 border-green-700';
    if (status === 'error') return 'bg-red-900/30 border-red-700';
    return 'bg-blue-900/30 border-blue-700';
  };

  const calculateStats = () => {
    let total = 0;
    let passed = 0;
    let failed = 0;

    Object.values(results).forEach(category => {
      Object.values(category).forEach(result => {
        total++;
        if (result.status === 'success') passed++;
        if (result.status === 'error') failed++;
      });
    });

    return { total, passed, failed, percentage: total > 0 ? Math.round((passed / total) * 100) : 0 };
  };

  const stats = calculateStats();

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
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            🧪 API Test Suite
          </h1>
          <p className="text-slate-400">
            Test all API endpoints to verify backend connectivity and functionality
          </p>
        </div>

        {/* Controls */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={runAllTests}
                disabled={testing || !user}
                className="flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium transition-colors"
              >
                {testing ? (
                  <>
                    <Loader className="animate-spin" size={20} />
                    Testing...
                  </>
                ) : (
                  <>
                    <Play size={20} />
                    Run All Tests
                  </>
                )}
              </button>
              
              {Object.keys(results).length > 0 && (
                <button
                  onClick={() => setResults({})}
                  disabled={testing}
                  className="flex items-center gap-2 px-4 py-3 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-slate-300 font-medium transition-colors"
                >
                  <RefreshCw size={20} />
                  Clear Results
                </button>
              )}
            </div>

            {!user && (
              <div className="text-yellow-400 text-sm">
                ⚠️ Please login to run tests
              </div>
            )}
          </div>

          {currentTest && (
            <div className="mt-4 p-3 bg-blue-900/30 border border-blue-700 rounded-lg text-blue-300 text-sm flex items-center gap-2">
              <Loader className="animate-spin" size={16} />
              Currently testing: {currentTest}
            </div>
          )}
        </div>

        {/* Stats Summary */}
        {stats.total > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4">
              <div className="text-sm text-slate-400 mb-1">Total Tests</div>
              <div className="text-3xl font-bold">{stats.total}</div>
            </div>
            <div className="bg-green-900/30 border border-green-700 rounded-xl p-4">
              <div className="text-sm text-green-300 mb-1">Passed</div>
              <div className="text-3xl font-bold text-green-400">{stats.passed}</div>
            </div>
            <div className="bg-red-900/30 border border-red-700 rounded-xl p-4">
              <div className="text-sm text-red-300 mb-1">Failed</div>
              <div className="text-3xl font-bold text-red-400">{stats.failed}</div>
            </div>
            <div className="bg-purple-900/30 border border-purple-700 rounded-xl p-4">
              <div className="text-sm text-purple-300 mb-1">Success Rate</div>
              <div className="text-3xl font-bold text-purple-400">{stats.percentage}%</div>
            </div>
          </div>
        )}

        {/* Results */}
        {Object.keys(results).length > 0 ? (
          <div className="space-y-6">
            {Object.entries(results).map(([category, endpoints]) => (
              <div key={category} className="bg-slate-900/70 border border-slate-800 rounded-xl p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  {category}
                  <span className="text-sm text-slate-400">
                    ({Object.values(endpoints).filter(e => e.status === 'success').length}/{Object.keys(endpoints).length} passed)
                  </span>
                </h2>
                
                <div className="space-y-3">
                  {Object.entries(endpoints).map(([endpoint, result]) => (
                    <div
                      key={endpoint}
                      className={`p-4 rounded-lg border ${getStatusColor(result.status)} transition-colors`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1">
                          {getStatusIcon(result.status)}
                          <div className="flex-1">
                            <div className="font-medium mb-1">{endpoint}</div>
                            <div className="text-sm text-slate-400 mb-2">{result.message}</div>
                            
                            {result.data && (
                              <details className="text-xs">
                                <summary className="cursor-pointer text-slate-500 hover:text-slate-300">
                                  View Response Data
                                </summary>
                                <pre className="mt-2 p-3 bg-slate-950 rounded border border-slate-700 overflow-x-auto">
                                  {JSON.stringify(result.data, null, 2)}
                                </pre>
                              </details>
                            )}
                          </div>
                        </div>
                        
                        <div className="text-xs text-slate-500">
                          {new Date(result.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-12 text-center">
            <div className="text-6xl mb-4">🧪</div>
            <h3 className="text-xl font-semibold mb-2">No tests run yet</h3>
            <p className="text-slate-400">
              Click "Run All Tests" to start testing all API endpoints
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

export default ApiTestPage;
