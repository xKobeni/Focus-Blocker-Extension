import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../stores/authStore';
import { getUserFocusSessions, calculateSessionStats } from '../services/focusSessionService';
import { ArrowLeft, TrendingUp, Clock, Target, Calendar, BarChart3, Zap } from 'lucide-react';

function AnalyticsPage() {
  const navigate = useNavigate();
  const { user, fetchUser } = useAuthStore();
  
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('week'); // week, month, all

  useEffect(() => {
    if (!user) {
      fetchUser();
    }
  }, [user, fetchUser]);

  useEffect(() => {
    if (user?._id) {
      loadSessionData();
    }
  }, [user]);

  const loadSessionData = async () => {
    if (!user?._id) return;
    
    setLoading(true);
    try {
      const data = await getUserFocusSessions(user._id);
      setSessions(data);
    } catch (err) {
      console.error('Failed to load sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter sessions by time range
  const getFilteredSessions = () => {
    if (!sessions.length) return [];
    
    const now = new Date();
    let cutoffDate;
    
    switch (timeRange) {
      case 'week':
        cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        return sessions;
    }
    
    return sessions.filter(s => new Date(s.createdAt) >= cutoffDate);
  };

  // Calculate sessions by day of week
  const getSessionsByDayOfWeek = () => {
    const filteredSessions = getFilteredSessions();
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const counts = new Array(7).fill(0);
    const minutes = new Array(7).fill(0);
    
    filteredSessions.forEach(session => {
      if (session.duration) {
        const dayOfWeek = new Date(session.createdAt).getDay();
        counts[dayOfWeek]++;
        minutes[dayOfWeek] += session.duration;
      }
    });
    
    const maxCount = Math.max(...counts, 1);
    
    return days.map((day, idx) => ({
      day,
      count: counts[idx],
      minutes: minutes[idx],
      percentage: (counts[idx] / maxCount) * 100,
    }));
  };

  // Calculate sessions by time of day
  const getSessionsByTimeOfDay = () => {
    const filteredSessions = getFilteredSessions();
    const timeSlots = ['Morning\n(6-12)', 'Afternoon\n(12-18)', 'Evening\n(18-24)', 'Night\n(0-6)'];
    const counts = new Array(4).fill(0);
    
    filteredSessions.forEach(session => {
      if (session.duration) {
        const hour = new Date(session.createdAt).getHours();
        if (hour >= 6 && hour < 12) counts[0]++;
        else if (hour >= 12 && hour < 18) counts[1]++;
        else if (hour >= 18 && hour < 24) counts[2]++;
        else counts[3]++;
      }
    });
    
    const maxCount = Math.max(...counts, 1);
    
    return timeSlots.map((slot, idx) => ({
      slot,
      count: counts[idx],
      percentage: (counts[idx] / maxCount) * 100,
    }));
  };

  // Calculate daily sessions for the past week
  const getDailySessionsChart = () => {
    const filteredSessions = getFilteredSessions();
    const days = 7;
    const data = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      const daySessions = filteredSessions.filter(s => {
        const sessionDate = new Date(s.createdAt);
        return sessionDate >= date && sessionDate < nextDate && s.duration;
      });
      
      const totalMinutes = daySessions.reduce((sum, s) => sum + (s.duration || 0), 0);
      
      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        sessions: daySessions.length,
        minutes: totalMinutes,
        percentage: 0, // Will calculate after
      });
    }
    
    const maxMinutes = Math.max(...data.map(d => d.minutes), 1);
    data.forEach(d => d.percentage = (d.minutes / maxMinutes) * 100);
    
    return data;
  };

  const filteredSessions = getFilteredSessions();
  const stats = calculateSessionStats(filteredSessions);
  const dayOfWeekData = getSessionsByDayOfWeek();
  const timeOfDayData = getSessionsByTimeOfDay();
  const dailyData = getDailySessionsChart();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100">
        <div className="text-lg">Loading analytics...</div>
      </div>
    );
  }

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
            
            {/* Time Range Filter */}
            <div className="flex gap-2">
              {['week', 'month', 'all'].map(range => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    timeRange === range
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {range === 'week' ? '7 Days' : range === 'month' ? '30 Days' : 'All Time'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-3 mb-8">
          <BarChart3 size={32} className="text-emerald-500" />
          <h1 className="text-3xl font-bold">Focus Analytics</h1>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center gap-2 text-slate-400 mb-2">
              <Target size={18} />
              <span className="text-sm">Total Sessions</span>
            </div>
            <div className="text-3xl font-bold text-emerald-400">{stats.totalSessions}</div>
          </div>

          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center gap-2 text-slate-400 mb-2">
              <Clock size={18} />
              <span className="text-sm">Total Time</span>
            </div>
            <div className="text-3xl font-bold text-blue-400">{stats.totalHours}h {stats.totalMinutes % 60}m</div>
          </div>

          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center gap-2 text-slate-400 mb-2">
              <TrendingUp size={18} />
              <span className="text-sm">Avg. Duration</span>
            </div>
            <div className="text-3xl font-bold text-purple-400">{stats.averageMinutes} min</div>
          </div>

          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center gap-2 text-slate-400 mb-2">
              <Zap size={18} />
              <span className="text-sm">Distractions</span>
            </div>
            <div className="text-3xl font-bold text-yellow-400">{stats.totalDistractions}</div>
          </div>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Daily Sessions Chart */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <Calendar size={20} className="text-emerald-500" />
              Daily Focus Time (Last 7 Days)
            </h3>
            
            <div className="space-y-3">
              {dailyData.map((day, idx) => (
                <div key={idx}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-400">{day.date}</span>
                    <span className="text-slate-300 font-medium">
                      {day.minutes} min ({day.sessions} sessions)
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${day.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Day of Week Distribution */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <BarChart3 size={20} className="text-blue-500" />
              Sessions by Day of Week
            </h3>
            
            <div className="flex items-end justify-between h-48 gap-2">
              {dayOfWeekData.map((day, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                  <div className="text-xs text-slate-400 font-medium">{day.count}</div>
                  <div 
                    className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-md transition-all duration-500 hover:from-blue-400 hover:to-blue-300"
                    style={{ height: `${day.percentage}%` }}
                    title={`${day.count} sessions (${day.minutes} min)`}
                  />
                  <div className="text-xs text-slate-400 font-medium">{day.day}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Time of Day Distribution */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <Clock size={20} className="text-purple-500" />
              Sessions by Time of Day
            </h3>
            
            <div className="space-y-4">
              {timeOfDayData.map((time, idx) => (
                <div key={idx}>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-400">{time.slot.replace('\n', ' ')}</span>
                    <span className="text-slate-300 font-medium">{time.count} sessions</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-purple-500 to-purple-400 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${time.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Productivity Insights */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <TrendingUp size={20} className="text-emerald-500" />
              Productivity Insights
            </h3>
            
            <div className="space-y-4">
              <div className="p-4 bg-emerald-900/20 border border-emerald-700/30 rounded-lg">
                <div className="text-sm text-emerald-300 mb-1">Most Productive Day</div>
                <div className="text-xl font-bold text-emerald-200">
                  {dayOfWeekData.reduce((max, day) => day.minutes > max.minutes ? day : max, dayOfWeekData[0]).day}
                </div>
              </div>

              <div className="p-4 bg-blue-900/20 border border-blue-700/30 rounded-lg">
                <div className="text-sm text-blue-300 mb-1">Preferred Time</div>
                <div className="text-xl font-bold text-blue-200">
                  {timeOfDayData.reduce((max, time) => time.count > max.count ? time : max, timeOfDayData[0]).slot.replace('\n', ' ')}
                </div>
              </div>

              <div className="p-4 bg-purple-900/20 border border-purple-700/30 rounded-lg">
                <div className="text-sm text-purple-300 mb-1">Focus Rate</div>
                <div className="text-xl font-bold text-purple-200">
                  {stats.totalSessions > 0 
                    ? Math.round((stats.totalSessions / Math.max(filteredSessions.length, 1)) * 100)
                    : 0}% completion
                </div>
              </div>

              <div className="p-4 bg-yellow-900/20 border border-yellow-700/30 rounded-lg">
                <div className="text-sm text-yellow-300 mb-1">Avg. Distractions/Session</div>
                <div className="text-xl font-bold text-yellow-200">
                  {stats.averageDistractions} attempts
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* No Data Message */}
        {sessions.length === 0 && (
          <div className="text-center py-16 bg-slate-900/70 border border-slate-800 rounded-xl">
            <BarChart3 size={64} className="mx-auto mb-4 text-slate-700" />
            <h3 className="text-xl font-semibold mb-2">No Data Yet</h3>
            <p className="text-slate-400 mb-6">
              Start focusing to see your analytics and insights here!
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-lg font-medium transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default AnalyticsPage;
