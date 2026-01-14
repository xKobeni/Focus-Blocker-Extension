import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../stores/authStore';
import { getAllUsers, deleteUser, updateUserRole, getAllFocusSessions, getAllBlockedSites, getAllAchievements, calculatePlatformStats } from '../services/adminService';
import { ArrowLeft, Users, Shield, TrendingUp, Target, Globe, Trash2, Crown, User as UserIcon, CheckCircle } from 'lucide-react';

function AdminPage() {
  const navigate = useNavigate();
  const { user, fetchUser } = useAuthStore();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [blockedSites, setBlockedSites] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [stats, setStats] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!user) {
      fetchUser();
    }
  }, [user, fetchUser]);

  useEffect(() => {
    // Redirect non-admins
    if (user && user.role !== 'admin') {
      navigate('/dashboard');
      return;
    }
    
    if (user?.role === 'admin') {
      loadAdminData();
    }
  }, [user, navigate]);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [usersData, sessionsData, blockedSitesData, achievementsData] = await Promise.all([
        getAllUsers().catch(() => []),
        getAllFocusSessions().catch(() => []),
        getAllBlockedSites().catch(() => []),
        getAllAchievements().catch(() => []),
      ]);

      setUsers(usersData);
      setSessions(sessionsData);
      setBlockedSites(blockedSitesData);
      setAchievements(achievementsData);
      
      const platformStats = calculatePlatformStats(usersData, sessionsData, blockedSitesData, achievementsData);
      setStats(platformStats);
    } catch (err) {
      console.error('Failed to load admin data:', err);
      showError('Failed to load admin data: ' + err.message);
    } finally {
      setLoading(false);
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

  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteUser(userId);
      await loadAdminData();
      showSuccess('User deleted successfully');
    } catch (err) {
      showError(err.message || 'Failed to delete user');
    }
  };

  const handleToggleUserRole = async (userId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    
    if (!confirm(`Change user role to "${newRole}"?`)) {
      return;
    }

    try {
      await updateUserRole(userId, newRole);
      await loadAdminData();
      showSuccess(`User role changed to ${newRole}`);
    } catch (err) {
      showError(err.message || 'Failed to update user role');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100">
        <div className="text-lg">Loading admin dashboard...</div>
      </div>
    );
  }

  if (user?.role !== 'admin') {
    return null;
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'sessions', label: 'Sessions', icon: Target },
    { id: 'sites', label: 'Blocked Sites', icon: Globe },
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
            
            <div className="flex items-center gap-2 px-3 py-1 bg-purple-600/20 border border-purple-500 rounded-full text-xs font-medium text-purple-400">
              <Shield size={14} />
              Admin Panel
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-8 flex items-center gap-3">
          <Shield size={32} className="text-purple-500" />
          Admin Dashboard
        </h1>

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

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && stats && (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-6">
                <div className="flex items-center gap-2 text-slate-400 mb-2">
                  <Users size={18} />
                  <span className="text-sm">Total Users</span>
                </div>
                <div className="text-3xl font-bold text-blue-400">{stats.users.total}</div>
                <div className="text-xs text-slate-500 mt-2">
                  {stats.users.admins} admins, {stats.users.regular} regular
                </div>
              </div>

              <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-6">
                <div className="flex items-center gap-2 text-slate-400 mb-2">
                  <Target size={18} />
                  <span className="text-sm">Total Sessions</span>
                </div>
                <div className="text-3xl font-bold text-emerald-400">{stats.sessions.total}</div>
                <div className="text-xs text-slate-500 mt-2">
                  {stats.sessions.completed} completed
                </div>
              </div>

              <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-6">
                <div className="flex items-center gap-2 text-slate-400 mb-2">
                  <TrendingUp size={18} />
                  <span className="text-sm">Focus Time</span>
                </div>
                <div className="text-3xl font-bold text-purple-400">{stats.sessions.totalHours}h</div>
                <div className="text-xs text-slate-500 mt-2">
                  Avg: {stats.sessions.averageMinutes} min/session
                </div>
              </div>

              <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-6">
                <div className="flex items-center gap-2 text-slate-400 mb-2">
                  <Globe size={18} />
                  <span className="text-sm">Blocked Sites</span>
                </div>
                <div className="text-3xl font-bold text-orange-400">{stats.blockedSites.total}</div>
                <div className="text-xs text-slate-500 mt-2">
                  {stats.blockedSites.active} active
                </div>
              </div>
            </div>

            {/* Top Users & Most Blocked */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Users */}
              <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Crown size={20} className="text-yellow-500" />
                  Top Users by XP
                </h3>
                
                <div className="space-y-3">
                  {stats.topUsers.map((topUser, idx) => (
                    <div key={topUser.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '🏅'}</span>
                        <div>
                          <div className="font-medium">{topUser.name}</div>
                          <div className="text-xs text-slate-400">Level {topUser.level} • {topUser.streak} day streak</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-purple-400">{topUser.xp} XP</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Most Blocked Domains */}
              <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Globe size={20} className="text-red-500" />
                  Most Blocked Domains
                </h3>
                
                <div className="space-y-3">
                  {stats.blockedSites.mostBlocked.map((site, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                      <div className="font-medium truncate flex-1">{site.domain}</div>
                      <div className="ml-3 px-3 py-1 bg-red-900/30 border border-red-700/50 rounded-full text-sm font-semibold text-red-300">
                        {site.count} users
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4">User Management</h3>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Name</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Email</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Role</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Level</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">XP</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Streak</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u._id} className="border-b border-slate-800 hover:bg-slate-800/50">
                      <td className="py-3 px-4 text-sm">{u.name || 'N/A'}</td>
                      <td className="py-3 px-4 text-sm text-slate-400">{u.email}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          u.role === 'admin' 
                            ? 'bg-purple-600/20 text-purple-400 border border-purple-500/50'
                            : 'bg-slate-700 text-slate-300'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm">{u.level || 1}</td>
                      <td className="py-3 px-4 text-sm">{u.xp || 0}</td>
                      <td className="py-3 px-4 text-sm">{u.streak || 0} days</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleToggleUserRole(u._id, u.role)}
                            disabled={u._id === user._id}
                            className={`p-2 rounded-md hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors ${
                              u.role === 'admin' ? 'text-purple-400' : 'text-slate-400'
                            }`}
                            title={u._id === user._id ? 'Cannot change own role' : 'Toggle admin role'}
                          >
                            <Shield size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u._id)}
                            disabled={u._id === user._id}
                            className="p-2 rounded-md text-red-400 hover:bg-red-900/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            title={u._id === user._id ? 'Cannot delete yourself' : 'Delete user'}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Sessions Tab */}
        {activeTab === 'sessions' && (
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4">All Focus Sessions</h3>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">User</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Start Time</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Duration</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Distractions</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Source</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.slice(0, 50).map(session => (
                    <tr key={session._id} className="border-b border-slate-800 hover:bg-slate-800/50">
                      <td className="py-3 px-4 text-sm">
                        {session.userId?.name || session.userId?.email || 'Unknown'}
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-400">
                        {new Date(session.startTime).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {session.duration ? `${session.duration} min` : '-'}
                      </td>
                      <td className="py-3 px-4 text-sm text-yellow-400">
                        {session.distractions || 0}
                      </td>
                      <td className="py-3 px-4 text-sm capitalize">{session.source}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          session.endTime 
                            ? 'bg-emerald-600/20 text-emerald-400'
                            : 'bg-orange-600/20 text-orange-400'
                        }`}>
                          {session.endTime ? 'Completed' : 'Active'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {sessions.length > 50 && (
              <p className="text-sm text-slate-500 mt-4 text-center">
                Showing 50 of {sessions.length} sessions
              </p>
            )}
          </div>
        )}

        {/* Blocked Sites Tab */}
        {activeTab === 'sites' && (
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4">All Blocked Sites</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {blockedSites.map(site => (
                <div key={site._id} className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="font-medium text-sm truncate flex-1">{site.url}</div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                      site.isActive
                        ? 'bg-emerald-600/20 text-emerald-400'
                        : 'bg-slate-700 text-slate-400'
                    }`}>
                      {site.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 capitalize">Category: {site.category}</div>
                  <div className="text-xs text-slate-500 mt-1">
                    User: {site.userId?.name || site.userId?.email || 'Unknown'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default AdminPage;
