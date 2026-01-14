import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../stores/authStore';
import { getUserUsageMetrics, getUsageStatistics } from '../services/usageMetricService';
import { BarChart3, ArrowLeft, Calendar, TrendingUp, Clock, Globe, Filter, Download } from 'lucide-react';

function UsageMetricsPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState(null);
  const [metrics, setMetrics] = useState([]);
  const [dateRange, setDateRange] = useState('7'); // days
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [error, setError] = useState(null);
  
  useEffect(() => {
    if (user?._id) {
      loadUsageData();
    }
  }, [user, dateRange, selectedCategory]);

  const loadUsageData = async () => {
    if (!user?._id) return;
    
    setLoading(true);
    setError(null);
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(dateRange));
      
      const filters = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        ...(selectedCategory !== 'all' && { category: selectedCategory })
      };
      
      console.log('📊 Loading usage data with filters:', filters);
      
      const [statsData, metricsData] = await Promise.all([
        getUsageStatistics(user._id, filters),
        getUserUsageMetrics(user._id, filters)
      ]);
      
      console.log('📊 Received statistics:', statsData);
      console.log('📊 Received metrics:', metricsData);
      
      setStatistics(statsData);
      setMetrics(metricsData);
    } catch (err) {
      console.error('Failed to load usage data:', err);
      setError(err.message || 'Failed to load usage data. Please try again.');
      setStatistics(null);
      setMetrics([]);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100">
        <div className="text-lg">Loading usage metrics...</div>
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
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <BarChart3 size={32} className="text-emerald-500" />
            Usage Metrics Dashboard
          </h1>
          <p className="text-slate-400">
            Track your website usage data in detail with comprehensive analytics
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-slate-400" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            >
              <option value="7">Last 7 days</option>
              <option value="14">Last 14 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-slate-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            >
              <option value="all">All Categories</option>
              <option value="social">Social Media</option>
              <option value="video">Video</option>
              <option value="gaming">Gaming</option>
              <option value="news">News</option>
              <option value="productivity">Productivity</option>
              <option value="shopping">Shopping</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-900/20 border border-red-800 rounded-xl p-4">
            <p className="text-red-300">{error}</p>
            <button
              onClick={loadUsageData}
              className="mt-2 text-sm text-red-400 hover:text-red-300 underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* No Data Message */}
        {!loading && !error && !statistics && (
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-12 text-center">
            <Globe size={64} className="mx-auto mb-4 text-slate-600" />
            <h3 className="text-xl font-semibold mb-2 text-slate-300">No Usage Data Available</h3>
            <p className="text-slate-400 mb-4">
              Start browsing websites to see your usage metrics here. The extension automatically tracks the websites you visit.
            </p>
            <button
              onClick={loadUsageData}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
            >
              Refresh Data
            </button>
          </div>
        )}

        {statistics && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Clock size={20} className="text-blue-400" />
                  <span className="text-sm text-slate-400">Total Time Spent</span>
                </div>
                <div className="text-3xl font-bold text-blue-300">
                  {formatTime(statistics.domainStats?.reduce((sum, d) => sum + (d.totalTime || 0), 0) || 0)}
                </div>
              </div>
              
              <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Globe size={20} className="text-purple-400" />
                  <span className="text-sm text-slate-400">Sites Visited</span>
                </div>
                <div className="text-3xl font-bold text-purple-300">
                  {statistics.domainStats?.length || 0}
                </div>
              </div>
              
              <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <TrendingUp size={20} className="text-emerald-400" />
                  <span className="text-sm text-slate-400">Total Visits</span>
                </div>
                <div className="text-3xl font-bold text-emerald-300">
                  {statistics.domainStats?.reduce((sum, d) => sum + (d.visitCount || 0), 0) || 0}
                </div>
              </div>
            </div>

            {/* Top Sites by Time */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp size={20} className="text-emerald-500" />
                  Top Sites by Time
                </h3>
                
                {statistics.domainStats && statistics.domainStats.length > 0 ? (
                  <div className="space-y-3">
                    {statistics.domainStats.slice(0, 10).map((site, idx) => {
                      const totalTime = statistics.domainStats.reduce((sum, d) => sum + (d.totalTime || 0), 0);
                      const percentage = totalTime > 0 ? (site.totalTime / totalTime) * 100 : 0;
                      
                      return (
                        <div key={idx} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium truncate">{site._id}</div>
                              <div className="text-xs text-slate-400 capitalize">{site.category}</div>
                            </div>
                            <div className="text-right ml-4">
                              <div className="text-sm font-semibold">{formatTime(site.totalTime)}</div>
                              <div className="text-xs text-slate-500">{site.visitCount} visits</div>
                            </div>
                          </div>
                          <div className="w-full bg-slate-800 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-2 rounded-full transition-all"
                              style={{ width: `${Math.min(percentage, 100)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-400">
                    <Globe size={48} className="mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No usage data available</p>
                  </div>
                )}
              </div>

              {/* Category Breakdown */}
              <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <BarChart3 size={20} className="text-purple-500" />
                  Category Breakdown
                </h3>
                
                {statistics.categoryStats && statistics.categoryStats.length > 0 ? (
                  <div className="space-y-3">
                    {statistics.categoryStats.map((category, idx) => {
                      const totalTime = statistics.categoryStats.reduce((sum, c) => sum + (c.totalTime || 0), 0);
                      const percentage = totalTime > 0 ? (category.totalTime / totalTime) * 100 : 0;
                      
                      return (
                        <div key={idx} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <div className="flex-1">
                              <div className="text-sm font-medium capitalize">{category._id || 'Unknown'}</div>
                              <div className="text-xs text-slate-400">{category.visitCount} visits</div>
                            </div>
                            <div className="text-right ml-4">
                              <div className="text-sm font-semibold">{formatTime(category.totalTime)}</div>
                              <div className="text-xs text-slate-500">{percentage.toFixed(1)}%</div>
                            </div>
                          </div>
                          <div className="w-full bg-slate-800 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-purple-500 to-purple-400 h-2 rounded-full transition-all"
                              style={{ width: `${Math.min(percentage, 100)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-400">
                    <BarChart3 size={48} className="mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No category data available</p>
                  </div>
                )}
              </div>
            </div>

            {/* Daily Usage Chart */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-6 mb-8">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Calendar size={20} className="text-blue-500" />
                Daily Usage Trend
              </h3>
              
              {statistics.dailyStats && statistics.dailyStats.length > 0 ? (
                <div className="space-y-4">
                  {statistics.dailyStats.map((day, idx) => {
                    const maxTime = Math.max(...statistics.dailyStats.map(d => d.totalTime || 0));
                    const percentage = maxTime > 0 ? ((day.totalTime || 0) / maxTime) * 100 : 0;
                    
                    return (
                      <div key={idx} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <div className="text-sm font-medium">{formatDate(day._id)}</div>
                          <div className="text-sm text-slate-400">
                            {formatTime(day.totalTime)} • {day.visitCount} visits
                          </div>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-3">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-blue-400 h-3 rounded-full transition-all"
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400">
                  <Calendar size={48} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No daily data available</p>
                </div>
              )}
            </div>

            {/* Detailed Metrics Table */}
            {metrics && metrics.length > 0 && (
              <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-6 mb-8">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <BarChart3 size={20} className="text-emerald-500" />
                  Detailed Usage Metrics
                </h3>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-700">
                        <th className="text-left py-3 px-4 text-slate-400">Domain</th>
                        <th className="text-left py-3 px-4 text-slate-400">URL</th>
                        <th className="text-right py-3 px-4 text-slate-400">Time Spent</th>
                        <th className="text-right py-3 px-4 text-slate-400">Visits</th>
                        <th className="text-center py-3 px-4 text-slate-400">Category</th>
                        <th className="text-center py-3 px-4 text-slate-400">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {metrics.slice(0, 50).map((metric, idx) => (
                        <tr key={idx} className="border-b border-slate-800 hover:bg-slate-800/50">
                          <td className="py-3 px-4 font-medium">{metric.domain}</td>
                          <td className="py-3 px-4 text-slate-400 truncate max-w-xs" title={metric.url}>
                            {metric.url || 'N/A'}
                          </td>
                          <td className="py-3 px-4 text-right">{formatTime(metric.timeSpent || 0)}</td>
                          <td className="py-3 px-4 text-right">{metric.visitCount || 0}</td>
                          <td className="py-3 px-4 text-center">
                            <span className="px-2 py-1 rounded text-xs bg-slate-800 capitalize">
                              {metric.category || 'other'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center text-slate-400">
                            {formatDate(metric.visitDate)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {metrics.length > 50 && (
                    <p className="mt-4 text-sm text-slate-400 text-center">
                      Showing first 50 of {metrics.length} records
                    </p>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* Debug Info (only in development) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 bg-slate-900/50 border border-slate-800 rounded-xl p-4 text-xs">
            <details>
              <summary className="cursor-pointer text-slate-400 hover:text-slate-300 mb-2">
                Debug Info (Development Only)
              </summary>
              <pre className="text-slate-400 overflow-auto max-h-64 mt-2">
                {JSON.stringify({ statistics, metricsCount: metrics?.length, loading, error }, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </main>
    </div>
  );
}

export default UsageMetricsPage;
