import { useState, useEffect } from 'react';
import { Trophy, Zap, Clock, Shield, Camera, Save, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

function ChallengeSettings({ settings, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    enabled: false,
    allowedTypes: ['math', 'memory', 'typing'],
    difficulty: 2,
    unlockDuration: 15,
    maxUnlocksPerSession: 3,
    requireWebcam: false,
    cooldownMinutes: 5
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (settings?.challengeSettings) {
      setFormData({
        enabled: settings.challengeSettings.enabled || false,
        allowedTypes: settings.challengeSettings.allowedTypes || ['math', 'memory', 'typing'],
        difficulty: settings.challengeSettings.difficulty || 2,
        unlockDuration: settings.challengeSettings.unlockDuration || 15,
        maxUnlocksPerSession: settings.challengeSettings.maxUnlocksPerSession || 3,
        requireWebcam: settings.challengeSettings.requireWebcam || false,
        cooldownMinutes: settings.challengeSettings.cooldownMinutes || 5
      });
    }
  }, [settings]);

  const challengeTypes = [
    { id: 'math', name: 'Math Problems', icon: '🔢', description: 'Solve mathematical equations' },
    { id: 'memory', name: 'Memory Game', icon: '🧠', description: 'Match pairs of cards' },
    { id: 'typing', name: 'Typing Speed', icon: '⌨️', description: 'Type text accurately and quickly' },
    { id: 'exercise', name: 'Physical Exercise', icon: '💪', description: 'Complete physical activities', webcamRequired: true },
    { id: 'breathing', name: 'Breathing Exercise', icon: '🧘', description: 'Follow breathing patterns' },
    { id: 'reaction', name: 'Reaction Time', icon: '⚡', description: 'Test your reflexes' }
  ];

  const difficultyLevels = [
    { value: 1, label: 'Easy', color: 'text-green-400', description: 'Simple challenges for beginners' },
    { value: 2, label: 'Medium', color: 'text-blue-400', description: 'Moderate difficulty' },
    { value: 3, label: 'Hard', color: 'text-yellow-400', description: 'Challenging problems' },
    { value: 4, label: 'Expert', color: 'text-orange-400', description: 'Very difficult challenges' },
    { value: 5, label: 'Master', color: 'text-red-400', description: 'Extremely challenging' }
  ];

  const handleToggleType = (typeId) => {
    const newTypes = formData.allowedTypes.includes(typeId)
      ? formData.allowedTypes.filter(t => t !== typeId)
      : [...formData.allowedTypes, typeId];
    
    // Ensure at least one type is selected
    if (newTypes.length > 0) {
      setFormData({ ...formData, allowedTypes: newTypes });
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSaveSuccess(false);

    try {
      await onSave({ challengeSettings: formData });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Enable/Disable */}
      <div className="bg-gradient-to-br from-slate-800/90 to-slate-800/70 border border-slate-700 rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30">
              <Trophy className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100">Enable Challenges</h3>
              <p className="text-sm text-slate-400">Allow unlocking blocked sites by completing challenges</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.enabled}
              onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-14 h-7 bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-purple-600 peer-checked:to-pink-600"></div>
          </label>
        </div>
      </div>

      {formData.enabled && (
        <>
          {/* Challenge Types */}
          <div className="bg-gradient-to-br from-slate-800/90 to-slate-800/70 border border-slate-700 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-400" />
              Challenge Types
            </h3>
            <p className="text-sm text-slate-400 mb-4">Select which types of challenges you want to use</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {challengeTypes.map((type) => {
                const isSelected = formData.allowedTypes.includes(type.id);
                const isDisabled = type.webcamRequired && !formData.requireWebcam;
                
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => handleToggleType(type.id)}
                    disabled={isDisabled}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      isSelected
                        ? 'bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-500/50'
                        : 'bg-slate-800/50 border-slate-600 hover:border-slate-500'
                    } ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{type.icon}</span>
                      <div className="flex-1">
                        <div className="font-semibold text-slate-100">{type.name}</div>
                        <div className="text-xs text-slate-400">{type.description}</div>
                        {type.webcamRequired && (
                          <div className="text-xs text-orange-400 mt-1 flex items-center gap-1">
                            <Camera className="w-3 h-3" />
                            Requires webcam
                          </div>
                        )}
                      </div>
                      {isSelected && (
                        <CheckCircle className="w-5 h-5 text-purple-400" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Difficulty Level */}
          <div className="bg-gradient-to-br from-slate-800/90 to-slate-800/70 border border-slate-700 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-400" />
              Difficulty Level
            </h3>
            <p className="text-sm text-slate-400 mb-4">Choose challenge difficulty</p>
            
            <div className="space-y-3">
              {difficultyLevels.map((level) => (
                <button
                  key={level.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, difficulty: level.value })}
                  className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                    formData.difficulty === level.value
                      ? 'bg-gradient-to-br from-blue-500/20 to-purple-500/20 border-blue-500/50'
                      : 'bg-slate-800/50 border-slate-600 hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className={`font-semibold ${level.color}`}>{level.label}</div>
                      <div className="text-xs text-slate-400">{level.description}</div>
                    </div>
                    {formData.difficulty === level.value && (
                      <CheckCircle className="w-5 h-5 text-blue-400" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Settings */}
          <div className="bg-gradient-to-br from-slate-800/90 to-slate-800/70 border border-slate-700 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-400" />
              Unlock Settings
            </h3>
            
            <div className="space-y-4">
              {/* Unlock Duration */}
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Unlock Duration (minutes)
                </label>
                <input
                  type="number"
                  min="5"
                  max="60"
                  value={formData.unlockDuration}
                  onChange={(e) => setFormData({ ...formData, unlockDuration: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-600 text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
                <p className="text-xs text-slate-500 mt-1">How long the site remains unlocked (5-60 minutes)</p>
              </div>

              {/* Max Unlocks Per Session */}
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Max Unlocks Per Session
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={formData.maxUnlocksPerSession}
                  onChange={(e) => setFormData({ ...formData, maxUnlocksPerSession: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-600 text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
                <p className="text-xs text-slate-500 mt-1">Maximum number of unlocks allowed per focus session (1-10)</p>
              </div>

              {/* Cooldown Period */}
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Cooldown Period (minutes)
                </label>
                <input
                  type="number"
                  min="0"
                  max="30"
                  value={formData.cooldownMinutes}
                  onChange={(e) => setFormData({ ...formData, cooldownMinutes: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-600 text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
                <p className="text-xs text-slate-500 mt-1">Time to wait between failed attempts (0-30 minutes)</p>
              </div>

              {/* Require Webcam */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-800/50 border border-slate-600">
                <div className="flex items-center gap-3">
                  <Camera className="w-5 h-5 text-blue-400" />
                  <div>
                    <p className="font-semibold text-slate-100">Require Webcam for Exercises</p>
                    <p className="text-xs text-slate-400">Enable exercise challenges with pose detection</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.requireWebcam}
                    onChange={(e) => setFormData({ ...formData, requireWebcam: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* XP Preview */}
          <div className="bg-gradient-to-br from-slate-800/90 to-slate-800/70 border border-emerald-500/30 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-400" />
              XP Rewards Preview
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {formData.allowedTypes.map((typeId) => {
                const type = challengeTypes.find(t => t.id === typeId);
                const xpRewards = {
                  math: { 1: 10, 2: 20, 3: 35, 4: 50, 5: 75 },
                  memory: { 1: 15, 2: 25, 3: 40, 4: 60, 5: 85 },
                  typing: { 1: 15, 2: 25, 3: 40, 4: 55, 5: 80 },
                  exercise: { 1: 30, 2: 50, 3: 75, 4: 100, 5: 150 },
                  breathing: { 1: 20, 2: 30, 3: 45, 4: 65, 5: 90 },
                  reaction: { 1: 10, 2: 18, 3: 30, 4: 45, 5: 65 }
                };
                const xp = xpRewards[typeId]?.[formData.difficulty] || 0;
                
                return (
                  <div key={typeId} className="p-3 rounded-xl bg-slate-800/50 border border-slate-600 text-center">
                    <div className="text-2xl mb-1">{type?.icon}</div>
                    <div className="text-lg font-bold text-yellow-400">+{xp} XP</div>
                    <div className="text-xs text-slate-400">{type?.name}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Success/Error Messages */}
      {saveSuccess && (
        <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 flex items-center gap-3">
          <CheckCircle className="w-5 h-5" />
          <span>Settings saved successfully!</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-6 py-3 rounded-xl bg-slate-800/50 border border-slate-600 text-slate-300 font-semibold hover:bg-slate-700/50 transition-all"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-bold hover:from-emerald-500 hover:to-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Save Settings
            </>
          )}
        </button>
      </div>

      {/* Info Box */}
      <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30">
        <p className="text-sm text-blue-300">
          <strong>💡 How it works:</strong> When you visit a blocked site during a focus session, 
          you'll have the option to complete a challenge. Successfully completing the challenge will 
          unlock the site for {formData.unlockDuration} minutes and earn you XP!
        </p>
      </div>
    </div>
  );
}

export default ChallengeSettings;
