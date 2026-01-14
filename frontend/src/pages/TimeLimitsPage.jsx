import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../stores/authStore';
import { getUserTimeLimits, createTimeLimit, deleteTimeLimit } from '../services/timeLimitService';
import { ArrowLeft, Clock, Plus, Trash2, CheckCircle } from 'lucide-react';

function TimeLimitsPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [timeLimits, setTimeLimits] = useState([]);
  const [newTimeLimit, setNewTimeLimit] = useState({ domain: '', dailyLimitMinutes: 60, action: 'block' });

  useEffect(() => {
    if (user?._id) {
      loadTimeLimits();
    }
  }, [user]);

  const loadTimeLimits = async () => {
    if (!user?._id) return;
    try {
      const limits = await getUserTimeLimits(user._id);
      setTimeLimits(limits);
    } catch (err) {
      console.error('Failed to load time limits:', err);
    }
  };

  const showSuccess = (message) => {
    setSuccessMessage(message);
    setErrorMessage('');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const showError = (message) => {
    setErrorMessage(message);
    setSuccessMessage('');
  };

  const handleAddTimeLimit = async (e) => {
    e.preventDefault();
    if (!user?._id || !newTimeLimit.domain.trim()) return;
    
    setLoading(true);
    try {
      await createTimeLimit({
        userId: user._id,
        domain: newTimeLimit.domain.trim(),
        url: newTimeLimit.domain.trim().startsWith('http') ? newTimeLimit.domain.trim() : `https://${newTimeLimit.domain.trim()}`,
        dailyLimitMinutes: parseInt(newTimeLimit.dailyLimitMinutes),
        action: newTimeLimit.action,
        isActive: true
      });
      await loadTimeLimits();
      setNewTimeLimit({ domain: '', dailyLimitMinutes: 60, action: 'block' });
      showSuccess('Time limit added successfully!');
    } catch (err) {
      showError(err.message || 'Failed to add time limit');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveTimeLimit = async (limitId) => {
    setLoading(true);
    try {
      await deleteTimeLimit(limitId);
      await loadTimeLimits();
      showSuccess('Time limit removed successfully!');
    } catch (err) {
      showError(err.message || 'Failed to remove time limit');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  };

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
            <Clock size={32} className="text-blue-500" />
            Time Limits
          </h1>
          <p className="text-slate-400">
            Take control of time-consuming websites by setting daily time limits. Once the limit is reached, the site will be blocked.
          </p>
        </div>

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

        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-6">
          {/* Add Time Limit Form */}
          <form onSubmit={handleAddTimeLimit} className="mb-6 p-4 bg-slate-800/50 rounded-lg">
            <h3 className="text-sm font-medium mb-3">Add Time Limit</h3>
            <div className="flex gap-3">
              <input
                type="text"
                value={newTimeLimit.domain}
                onChange={(e) => setNewTimeLimit({ ...newTimeLimit, domain: e.target.value })}
                className="flex-1 rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                placeholder="e.g., facebook.com"
              />
              <input
                type="number"
                min="1"
                value={newTimeLimit.dailyLimitMinutes}
                onChange={(e) => setNewTimeLimit({ ...newTimeLimit, dailyLimitMinutes: e.target.value })}
                className="w-32 rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                placeholder="Minutes"
              />
              <select
                value={newTimeLimit.action}
                onChange={(e) => setNewTimeLimit({ ...newTimeLimit, action: e.target.value })}
                className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              >
                <option value="block">Block</option>
                <option value="warn">Warn</option>
              </select>
              <button
                type="submit"
                disabled={loading || !newTimeLimit.domain.trim()}
                className="flex items-center gap-2 px-4 py-2 rounded-md bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
              >
                <Plus size={16} />
                Add
              </button>
            </div>
          </form>
          
          {/* Time Limits List */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-slate-400 mb-3">
              Active Time Limits ({timeLimits.length})
            </h3>
            {timeLimits.length > 0 ? (
              timeLimits.map(limit => (
                <div
                  key={limit._id}
                  className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="text-sm font-medium">{limit.domain}</div>
                    <div className="text-xs text-slate-400">
                      {limit.dailyLimitMinutes} minutes/day • {limit.action === 'block' ? 'Block when exceeded' : 'Warn when exceeded'}
                    </div>
                    {limit.timeUsedToday > 0 && (
                      <div className="text-xs text-yellow-400 mt-1">
                        Used today: {formatTime(limit.timeUsedToday)} / {limit.dailyLimitMinutes} minutes
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleRemoveTimeLimit(limit._id)}
                    disabled={loading}
                    className="p-2 rounded-md text-red-400 hover:bg-red-900/30 hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-400">
                <Clock size={48} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">No time limits set</p>
                <p className="text-xs mt-1">Add time limits to control how much time you spend on specific sites</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default TimeLimitsPage;
