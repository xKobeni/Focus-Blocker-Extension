import { create } from 'zustand';
import * as challengeService from '../services/challengeService';

const useChallengeStore = create((set, get) => ({
  // State
  challenges: [],
  activeUnlocks: [],
  stats: null,
  currentChallenge: null,
  isLoading: false,
  error: null,

  // Actions
  setLoading: (isLoading) => set({ isLoading }),
  
  setError: (error) => set({ error }),
  
  clearError: () => set({ error: null }),

  // Generate a new challenge
  generateChallenge: async (userId, domain, type = null) => {
    set({ isLoading: true, error: null });
    try {
      const challenge = await challengeService.generateChallenge(userId, domain, type);
      set({ 
        currentChallenge: challenge,
        isLoading: false,
        error: null 
      });
      return challenge;
    } catch (error) {
      set({ 
        error: error.message,
        isLoading: false 
      });
      throw error;
    }
  },

  // Verify challenge completion
  verifyChallenge: async (challengeId, userAnswer, timeTaken) => {
    set({ isLoading: true, error: null });
    try {
      const result = await challengeService.verifyChallenge(challengeId, userAnswer, timeTaken);
      
      // If successful, refresh active unlocks and stats
      if (result.success) {
        get().fetchActiveUnlocks();
        get().fetchStats();
      }
      
      set({ 
        currentChallenge: null,
        isLoading: false,
        error: null 
      });
      return result;
    } catch (error) {
      set({ 
        error: error.message,
        isLoading: false 
      });
      throw error;
    }
  },

  // Fetch user challenges
  fetchChallenges: async (userId, options = {}) => {
    set({ isLoading: true, error: null });
    try {
      const data = await challengeService.getUserChallenges(userId, options);
      set({ 
        challenges: data.challenges || data,
        isLoading: false,
        error: null 
      });
      return data;
    } catch (error) {
      set({ 
        error: error.message,
        isLoading: false 
      });
      throw error;
    }
  },

  // Fetch challenge stats
  fetchStats: async () => {
    try {
      const stats = await challengeService.getChallengeStats();
      set({ stats, error: null });
      return stats;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  // Fetch active unlocks
  fetchActiveUnlocks: async () => {
    try {
      const unlocks = await challengeService.getActiveUnlocks();
      set({ activeUnlocks: unlocks, error: null });
      return unlocks;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  // Check if domain is unlocked
  checkDomainUnlock: async (domain) => {
    try {
      const result = await challengeService.checkDomainUnlock(domain);
      return result;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  // Revoke an unlock
  revokeUnlock: async (unlockId) => {
    set({ isLoading: true, error: null });
    try {
      await challengeService.revokeUnlock(unlockId);
      
      // Refresh active unlocks
      await get().fetchActiveUnlocks();
      
      set({ isLoading: false, error: null });
    } catch (error) {
      set({ 
        error: error.message,
        isLoading: false 
      });
      throw error;
    }
  },

  // Get session unlocks
  fetchSessionUnlocks: async () => {
    try {
      const data = await challengeService.getSessionUnlocks();
      return data;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  // Get unlock history
  fetchUnlockHistory: async (options = {}) => {
    try {
      const data = await challengeService.getUnlockHistory(options);
      return data;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  // Clear current challenge
  clearCurrentChallenge: () => set({ currentChallenge: null }),

  // Reset store
  reset: () => set({
    challenges: [],
    activeUnlocks: [],
    stats: null,
    currentChallenge: null,
    isLoading: false,
    error: null
  })
}));

export default useChallengeStore;
