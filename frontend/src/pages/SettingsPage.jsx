import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, useSettingsStore, useUIStore } from '../stores';
import { updateUserProfile } from '../services/userService';
import ChallengeSettings from '../components/settings/ChallengeSettings';
import { LogOut, User, Lock, Globe, Trophy, ArrowLeft, Save, CheckCircle, Key } from 'lucide-react';

function SettingsPage() {
  const navigate = useNavigate();
  const { user, fetchUser, logout } = useAuthStore();
  
  // Settings Store
  const {
    userSettings,
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
  
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  
  // Profile form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  
  // Password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Preferences
  const [focusGoalMinutes, setFocusGoalMinutes] = useState(60);
  const [theme, setTheme] = useState('dark');
  
  // Password Protection
  const [settingsPassword, setSettingsPassword] = useState('');
  const [confirmSettingsPassword, setConfirmSettingsPassword] = useState('');
  const [requirePasswordForSettings, setRequirePasswordForSettings] = useState(false);

  useEffect(() => {
    if (!user) {
      fetchUser();
    }
  }, [user, fetchUser]);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setFocusGoalMinutes(user.focusGoalMinutes || 60);
      setTheme(user.theme || 'dark');
      
      // Load user settings
      fetchSettings(user._id).catch(() => {
        console.debug('User settings not found');
      });
    }
  }, [user, fetchSettings]);


  const showSuccess = (message) => {
    setSuccessMessage(message);
  };

  const showError = (message) => {
    setErrorMessage(message);
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!user?._id) return;
    
    setLoading(true);
    try {
      await updateUserProfile(user._id, { name });
      await fetchUser(); // Refresh user data
      showSuccess('Profile updated successfully!');
    } catch (err) {
      showError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!user?._id) return;
    
    if (newPassword !== confirmPassword) {
      showError('Passwords do not match');
      return;
    }
    
    if (newPassword.length < 6) {
      showError('Password must be at least 6 characters');
      return;
    }
    
    setLoading(true);
    try {
      await updateUserProfile(user._id, { password: newPassword });
      showSuccess('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      showError(err.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };


  const handleUpdatePreferences = async (e) => {
    e.preventDefault();
    if (!user?._id) return;
    
    setLoading(true);
    try {
      await updateUserProfile(user._id, { 
        focusGoalMinutes: parseInt(focusGoalMinutes),
        theme 
      });
      await fetchUser();
      showSuccess('Preferences updated successfully!');
    } catch (err) {
      showError(err.message || 'Failed to update preferences');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSavePasswordProtection = async (e) => {
    e.preventDefault();
    if (!user?._id) return;
    
    if (requirePasswordForSettings && settingsPassword !== confirmSettingsPassword) {
      showError('Passwords do not match');
      return;
    }
    
    if (requirePasswordForSettings && settingsPassword.length < 6) {
      showError('Password must be at least 6 characters');
      return;
    }
    
    setLoading(true);
    try {
      // This would be handled by UserSettings API
      // For now, we'll show a message
      showSuccess('Password protection settings saved! (Note: Backend implementation needed)');
      setSettingsPassword('');
      setConfirmSettingsPassword('');
    } catch (err) {
      showError(err.message || 'Failed to save password protection settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveChallengeSettings = async (challengeSettings) => {
    if (!user?._id) return;
    
    try {
      if (userSettings) {
        await updateSettings(user._id, challengeSettings);
      } else {
        await createSettings(user._id, challengeSettings);
      }
      showSuccess('Challenge settings saved successfully!');
    } catch (err) {
      throw new Error(err.message || 'Failed to save challenge settings');
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'preferences', label: 'Preferences', icon: Globe },
    { id: 'challenges', label: 'Challenges', icon: Trophy },
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
            
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-md bg-slate-800 hover:bg-slate-700 text-sm font-medium transition-colors"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-8">Settings</h1>

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

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Sidebar Tabs */}
          <div className="md:col-span-1">
            <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-2">
              {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      activeTab === tab.id
                        ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-700/50'
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
          <div className="md:col-span-3">
            <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-6">
              
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div>
                  <h2 className="text-xl font-semibold mb-6">Profile Information</h2>
                  
                  <form onSubmit={handleUpdateProfile} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2" htmlFor="name">
                        Name
                      </label>
                      <input
                        id="name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                        placeholder="Your name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2" htmlFor="email">
                        Email
                      </label>
                      <input
                        id="email"
                        type="email"
                        value={email}
                        disabled
                        className="w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm outline-none text-slate-500 cursor-not-allowed"
                        placeholder="your@email.com"
                      />
                      <p className="text-xs text-slate-500 mt-1">Email cannot be changed</p>
                    </div>

                    <div className="pt-4">
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 rounded-md bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
                      >
                        <Save size={16} />
                        {loading ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <div>
                  <h2 className="text-xl font-semibold mb-6">Security Settings</h2>
                  
                  {/* Password Protection */}
                  <div className="mb-8 p-4 bg-slate-800/50 rounded-lg">
                    <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                      <Key size={18} />
                      Password Protection for Settings
                    </h3>
                    <p className="text-sm text-slate-400 mb-4">
                      Require a password to change settings. This helps prevent you from easily disabling blocking when tempted.
                    </p>
                    
                    <form onSubmit={handleSavePasswordProtection} className="space-y-4">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id="requirePassword"
                          checked={requirePasswordForSettings}
                          onChange={(e) => setRequirePasswordForSettings(e.target.checked)}
                          className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-emerald-600 focus:ring-emerald-500"
                        />
                        <label htmlFor="requirePassword" className="text-sm font-medium">
                          Require password to change settings
                        </label>
                      </div>
                      
                      {requirePasswordForSettings && (
                        <>
                          <div>
                            <label className="block text-sm font-medium mb-2">Settings Password</label>
                            <input
                              type="password"
                              value={settingsPassword}
                              onChange={(e) => setSettingsPassword(e.target.value)}
                              className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                              placeholder="Enter password"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">Confirm Password</label>
                            <input
                              type="password"
                              value={confirmSettingsPassword}
                              onChange={(e) => setConfirmSettingsPassword(e.target.value)}
                              className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                              placeholder="Confirm password"
                            />
                          </div>
                        </>
                      )}
                      
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 rounded-md bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
                      >
                        <Save size={16} />
                        Save Password Protection
                      </button>
                    </form>
                  </div>
                  
                  {/* Change Account Password */}
                  <div className="p-4 bg-slate-800/50 rounded-lg">
                    <h3 className="text-lg font-medium mb-4">Change Account Password</h3>
                    
                    <form onSubmit={handleChangePassword} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2" htmlFor="current-password">
                        Current Password
                      </label>
                      <input
                        id="current-password"
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                        placeholder="••••••••"
                        autoComplete="current-password"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2" htmlFor="new-password">
                        New Password
                      </label>
                      <input
                        id="new-password"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                        placeholder="••••••••"
                        autoComplete="new-password"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2" htmlFor="confirm-password">
                        Confirm New Password
                      </label>
                      <input
                        id="confirm-password"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                        placeholder="••••••••"
                        autoComplete="new-password"
                      />
                    </div>

                    <div className="pt-4">
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 rounded-md bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
                      >
                        <Lock size={16} />
                        {loading ? 'Updating...' : 'Update Password'}
                      </button>
                    </div>
                  </form>
                  </div>
                </div>
              )}

              {/* Preferences Tab */}
              {activeTab === 'preferences' && (
                <div>
                  <h2 className="text-xl font-semibold mb-6">Preferences</h2>
                  
                  <form onSubmit={handleUpdatePreferences} className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium mb-2" htmlFor="focus-goal">
                        Daily Focus Goal (minutes)
                      </label>
                      <input
                        id="focus-goal"
                        type="number"
                        min="15"
                        max="480"
                        step="15"
                        value={focusGoalMinutes}
                        onChange={(e) => setFocusGoalMinutes(e.target.value)}
                        className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                      />
                      <p className="text-xs text-slate-500 mt-1">
                        Set your daily focus time goal
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2" htmlFor="theme">
                        Theme
                      </label>
                      <select
                        id="theme"
                        value={theme}
                        onChange={(e) => setTheme(e.target.value)}
                        className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                      >
                        <option value="dark">Dark</option>
                        <option value="light">Light</option>
                        <option value="auto">Auto (System)</option>
                      </select>
                    </div>

                    <div className="pt-4">
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 rounded-md bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
                      >
                        <Save size={16} />
                        {loading ? 'Saving...' : 'Save Preferences'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Challenges Tab */}
              {activeTab === 'challenges' && (
                <div>
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
        </div>
      </main>
    </div>
  );
}

export default SettingsPage;
