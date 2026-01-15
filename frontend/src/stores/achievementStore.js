import { create } from 'zustand';
import * as achievementService from '../services/achievementService';

const useAchievementStore = create((set, get) => ({
  // State
  achievements: [],
  userAchievements: [],
  isLoading: false,
  error: null,

  // Actions
  setLoading: (isLoading) => set({ isLoading }),
  
  setError: (error) => set({ error }),
  
  clearError: () => set({ error: null }),

  // Fetch all available achievements
  fetchAchievements: async () => {
    set({ isLoading: true, error: null });
    try {
      const achievements = await achievementService.getAllAchievements();
      set({ 
        achievements,
        isLoading: false,
        error: null 
      });
      return achievements;
    } catch (error) {
      set({ 
        error: error.message,
        isLoading: false 
      });
      throw error;
    }
  },

  // Fetch user's achievements
  fetchUserAchievements: async (userId) => {
    set({ isLoading: true, error: null });
    try {
      const userAchievements = await achievementService.getUserAchievements(userId);
      set({ 
        userAchievements,
        isLoading: false,
        error: null 
      });
      return userAchievements;
    } catch (error) {
      set({ 
        error: error.message,
        isLoading: false 
      });
      throw error;
    }
  },

  // Check for new achievements
  checkAchievements: async (userId) => {
    try {
      const result = await achievementService.checkUserAchievements(userId);
      
      // If new achievements were earned, refresh user achievements
      if (result.newAchievements && result.newAchievements.length > 0) {
        await get().fetchUserAchievements(userId);
      }
      
      return result;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  // Get achievement statistics
  getStats: () => {
    const { achievements, userAchievements } = get();
    const total = achievements.length;
    const unlocked = userAchievements.length;
    const percentage = total > 0 ? Math.round((unlocked / total) * 100) : 0;
    
    return {
      total,
      unlocked,
      locked: total - unlocked,
      percentage
    };
  },

  // Check if achievement is unlocked
  isAchievementUnlocked: (achievementId) => {
    const { userAchievements } = get();
    return userAchievements.some(ua => 
      ua.achievementId === achievementId || ua.achievementId._id === achievementId
    );
  },

  // Reset store
  reset: () => set({
    achievements: [],
    userAchievements: [],
    isLoading: false,
    error: null
  })
}));

export default useAchievementStore;
