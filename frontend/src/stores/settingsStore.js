import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import * as userSettingsService from '../services/userSettingsService';

const useSettingsStore = create(
  persist(
    (set, get) => ({
      // State
      userSettings: null,
      isLoading: false,
      error: null,
      lastFetched: null,

      // Actions
      setLoading: (isLoading) => set({ isLoading }),
      
      setError: (error) => set({ error }),
      
      clearError: () => set({ error: null }),

      // Fetch user settings
      fetchSettings: async (userId, force = false) => {
        // Check cache (avoid unnecessary requests)
        const { userSettings, lastFetched } = get();
        if (!force && userSettings && lastFetched) {
          const cacheAge = Date.now() - lastFetched;
          if (cacheAge < 60000) { // Cache for 1 minute
            return userSettings;
          }
        }

        set({ isLoading: true, error: null });
        try {
          const settings = await userSettingsService.getUserSettings(userId);
          set({ 
            userSettings: settings,
            lastFetched: Date.now(),
            isLoading: false,
            error: null 
          });
          return settings;
        } catch (error) {
          // If settings don't exist yet, that's okay
          if (error.message.includes('not found')) {
            set({ 
              userSettings: null,
              isLoading: false,
              error: null 
            });
          } else {
            set({ 
              error: error.message,
              isLoading: false 
            });
          }
          throw error;
        }
      },

      // Update user settings
      updateSettings: async (userId, settings) => {
        set({ isLoading: true, error: null });
        try {
          const updated = await userSettingsService.updateUserSettings(userId, settings);
          set({ 
            userSettings: updated,
            lastFetched: Date.now(),
            isLoading: false,
            error: null 
          });
          return updated;
        } catch (error) {
          set({ 
            error: error.message,
            isLoading: false 
          });
          throw error;
        }
      },

      // Create user settings
      createSettings: async (userId, settings) => {
        set({ isLoading: true, error: null });
        try {
          const created = await userSettingsService.createUserSettings(userId, settings);
          set({ 
            userSettings: created,
            lastFetched: Date.now(),
            isLoading: false,
            error: null 
          });
          return created;
        } catch (error) {
          set({ 
            error: error.message,
            isLoading: false 
          });
          throw error;
        }
      },

      // Update challenge settings specifically
      updateChallengeSettings: async (userId, challengeSettings) => {
        const { userSettings } = get();
        const updated = {
          ...userSettings,
          challengeSettings
        };
        return get().updateSettings(userId, updated);
      },

      // Get challenge settings
      getChallengeSettings: () => {
        const { userSettings } = get();
        return userSettings?.challengeSettings || {
          enabled: false,
          allowedTypes: ['math', 'memory', 'typing'],
          difficulty: 2,
          unlockDuration: 15,
          maxUnlocksPerSession: 3,
          requireWebcam: false,
          cooldownMinutes: 5
        };
      },

      // Check if challenges are enabled
      isChallengesEnabled: () => {
        const settings = get().getChallengeSettings();
        return settings.enabled === true;
      },

      // Invalidate cache
      invalidateCache: () => set({ lastFetched: null }),

      // Reset store
      reset: () => set({
        userSettings: null,
        isLoading: false,
        error: null,
        lastFetched: null
      })
    }),
    {
      name: 'settings-storage',
      partialize: (state) => ({ 
        userSettings: state.userSettings,
        lastFetched: state.lastFetched
      })
    }
  )
);

export default useSettingsStore;
