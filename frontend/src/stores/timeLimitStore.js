import { create } from 'zustand';
import * as timeLimitService from '../services/timeLimitService';

const useTimeLimitStore = create((set, get) => ({
  // State
  timeLimits: [],
  currentLimit: null,
  isLoading: false,
  error: null,

  // Actions
  setLoading: (isLoading) => set({ isLoading }),
  
  setError: (error) => set({ error }),
  
  clearError: () => set({ error: null }),

  // Fetch all time limits for a user
  fetchTimeLimits: async (userId) => {
    set({ isLoading: true, error: null });
    try {
      const limits = await timeLimitService.getUserTimeLimits(userId);
      set({ 
        timeLimits: limits,
        isLoading: false,
        error: null 
      });
      return limits;
    } catch (error) {
      set({ 
        error: error.message,
        isLoading: false 
      });
      throw error;
    }
  },

  // Get single time limit (optional - not critical)
  fetchTimeLimit: async (limitId) => {
    set({ isLoading: true, error: null });
    try {
      // Find in existing timeLimits first
      const existing = get().timeLimits.find(limit => limit._id === limitId);
      if (existing) {
        set({ currentLimit: existing, isLoading: false });
        return existing;
      }
      set({ currentLimit: null, isLoading: false });
      return null;
    } catch (error) {
      set({ 
        error: error.message,
        isLoading: false 
      });
      throw error;
    }
  },

  // Create new time limit
  createTimeLimit: async (userId, limitData) => {
    set({ isLoading: true, error: null });
    try {
      // Merge userId into limitData to match service signature
      const dataWithUserId = { ...limitData, userId };
      const newLimit = await timeLimitService.createTimeLimit(dataWithUserId);
      set((state) => ({ 
        timeLimits: [...state.timeLimits, newLimit],
        isLoading: false,
        error: null 
      }));
      return newLimit;
    } catch (error) {
      set({ 
        error: error.message,
        isLoading: false 
      });
      throw error;
    }
  },

  // Update time limit
  updateTimeLimit: async (limitId, limitData) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await timeLimitService.updateTimeLimit(limitId, limitData);
      set((state) => ({ 
        timeLimits: state.timeLimits.map(limit => 
          limit._id === limitId ? updated : limit
        ),
        currentLimit: state.currentLimit?._id === limitId ? updated : state.currentLimit,
        isLoading: false,
        error: null 
      }));
      return updated;
    } catch (error) {
      set({ 
        error: error.message,
        isLoading: false 
      });
      throw error;
    }
  },

  // Delete time limit
  deleteTimeLimit: async (limitId) => {
    set({ isLoading: true, error: null });
    try {
      await timeLimitService.deleteTimeLimit(limitId);
      set((state) => ({ 
        timeLimits: state.timeLimits.filter(limit => limit._id !== limitId),
        currentLimit: state.currentLimit?._id === limitId ? null : state.currentLimit,
        isLoading: false,
        error: null 
      }));
    } catch (error) {
      set({ 
        error: error.message,
        isLoading: false 
      });
      throw error;
    }
  },

  // Check if time limit exceeded (manual check using stored data)
  checkTimeLimit: (userId, domain) => {
    try {
      const { timeLimits } = get();
      const limit = timeLimits.find(tl => 
        tl.domain === domain && tl.userId === userId && tl.isActive
      );
      
      if (!limit) {
        return { exceeded: false, limit: null };
      }
      
      const timeUsedMinutes = limit.timeUsedToday ? Math.floor(limit.timeUsedToday / 60) : 0;
      const exceeded = timeUsedMinutes >= limit.dailyLimitMinutes;
      
      return {
        exceeded,
        limit,
        timeUsed: timeUsedMinutes,
        timeRemaining: Math.max(0, limit.dailyLimitMinutes - timeUsedMinutes)
      };
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  // Clear current limit
  clearCurrentLimit: () => set({ currentLimit: null }),

  // Reset store
  reset: () => set({
    timeLimits: [],
    currentLimit: null,
    isLoading: false,
    error: null
  })
}));

export default useTimeLimitStore;
