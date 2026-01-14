import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../stores/authStore';
import { getUserSchedules, createSchedule, deleteSchedule } from '../services/scheduleService';
import { ArrowLeft, Calendar, Plus, Trash2, CheckCircle } from 'lucide-react';

function SchedulePage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [schedules, setSchedules] = useState([]);
  const [newSchedule, setNewSchedule] = useState({
    name: '',
    daysOfWeek: [],
    startTime: '09:00',
    endTime: '17:00',
    action: 'block_all',
    isActive: true
  });

  useEffect(() => {
    if (user?._id) {
      loadSchedules();
    }
  }, [user]);

  const loadSchedules = async () => {
    if (!user?._id) return;
    try {
      const scheds = await getUserSchedules(user._id);
      setSchedules(scheds);
    } catch (err) {
      console.error('Failed to load schedules:', err);
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

  const handleAddSchedule = async (e) => {
    e.preventDefault();
    if (!user?._id || !newSchedule.name.trim() || newSchedule.daysOfWeek.length === 0) return;
    
    setLoading(true);
    try {
      await createSchedule({
        userId: user._id,
        ...newSchedule
      });
      await loadSchedules();
      setNewSchedule({
        name: '',
        daysOfWeek: [],
        startTime: '09:00',
        endTime: '17:00',
        action: 'block_all',
        isActive: true
      });
      showSuccess('Schedule created successfully!');
    } catch (err) {
      showError(err.message || 'Failed to create schedule');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveSchedule = async (scheduleId) => {
    setLoading(true);
    try {
      await deleteSchedule(scheduleId);
      await loadSchedules();
      showSuccess('Schedule deleted successfully!');
    } catch (err) {
      showError(err.message || 'Failed to delete schedule');
    } finally {
      setLoading(false);
    }
  };

  const daysOfWeek = [
    { value: 0, label: 'Sunday' },
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' }
  ];

  const toggleDay = (day) => {
    setNewSchedule(prev => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(day)
        ? prev.daysOfWeek.filter(d => d !== day)
        : [...prev.daysOfWeek, day]
    }));
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
            <Calendar size={32} className="text-purple-500" />
            Schedule
          </h1>
          <p className="text-slate-400">
            Block all your distractions during the hours you choose.
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
          {/* Create Schedule Form */}
          <form onSubmit={handleAddSchedule} className="mb-6 p-4 bg-slate-800/50 rounded-lg">
            <h3 className="text-sm font-medium mb-3">Create Schedule</h3>
            <div className="space-y-4">
              <input
                type="text"
                value={newSchedule.name}
                onChange={(e) => setNewSchedule({ ...newSchedule, name: e.target.value })}
                className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                placeholder="Schedule name (e.g., Work Hours)"
              />
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Start Time</label>
                  <input
                    type="time"
                    value={newSchedule.startTime}
                    onChange={(e) => setNewSchedule({ ...newSchedule, startTime: e.target.value })}
                    className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">End Time</label>
                  <input
                    type="time"
                    value={newSchedule.endTime}
                    onChange={(e) => setNewSchedule({ ...newSchedule, endTime: e.target.value })}
                    className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-xs text-slate-400 mb-2">Days of Week</label>
                <div className="flex flex-wrap gap-2">
                  {daysOfWeek.map(day => (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => toggleDay(day.value)}
                      className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                        newSchedule.daysOfWeek.includes(day.value)
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {day.label.slice(0, 3)}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-xs text-slate-400 mb-1">Action</label>
                <select
                  value={newSchedule.action}
                  onChange={(e) => setNewSchedule({ ...newSchedule, action: e.target.value })}
                  className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="block_all">Block All Distractions</option>
                  <option value="block_categories">Block Categories</option>
                  <option value="block_sites">Block Specific Sites</option>
                  <option value="time_limit">Apply Time Limits</option>
                </select>
              </div>
              
              <button
                type="submit"
                disabled={loading || !newSchedule.name.trim() || newSchedule.daysOfWeek.length === 0}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
              >
                <Plus size={16} />
                Create Schedule
              </button>
            </div>
          </form>
          
          {/* Schedules List */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-slate-400 mb-3">
              Active Schedules ({schedules.length})
            </h3>
            {schedules.length > 0 ? (
              schedules.map(schedule => (
                <div
                  key={schedule._id}
                  className="p-3 bg-slate-800/50 rounded-lg"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="text-sm font-medium">{schedule.name}</div>
                      <div className="text-xs text-slate-400 mt-1">
                        {schedule.startTime} - {schedule.endTime} • {schedule.daysOfWeek.map(d => daysOfWeek[d].label.slice(0, 3)).join(', ')}
                      </div>
                      <div className="text-xs text-slate-500 mt-1 capitalize">
                        Action: {schedule.action.replace('_', ' ')}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveSchedule(schedule._id)}
                      disabled={loading}
                      className="p-2 rounded-md text-red-400 hover:bg-red-900/30 hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-400">
                <Calendar size={48} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">No schedules created</p>
                <p className="text-xs mt-1">Create a schedule to automatically block distractions during specific hours</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default SchedulePage;
