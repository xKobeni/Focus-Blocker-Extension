import { create } from 'zustand';
import * as blockedSiteService from '../services/blockedSiteService';

const useBlockedSiteStore = create((set, get) => ({
  // State
  blockedSites: [],
  currentSite: null,
  isLoading: false,
  error: null,

  // Actions
  setLoading: (isLoading) => set({ isLoading }),
  
  setError: (error) => set({ error }),
  
  clearError: () => set({ error: null }),

  // Fetch all blocked sites for a user
  fetchBlockedSites: async (userId) => {
    set({ isLoading: true, error: null });
    try {
      const sites = await blockedSiteService.getUserBlockedSites(userId);
      set({ 
        blockedSites: sites,
        isLoading: false,
        error: null 
      });
      return sites;
    } catch (error) {
      set({ 
        error: error.message,
        isLoading: false 
      });
      throw error;
    }
  },

  // Get single blocked site (optional - not critical)
  fetchBlockedSite: async (siteId) => {
    set({ isLoading: true, error: null });
    try {
      // Find in existing blockedSites first, or fetch from server if needed
      const existing = get().blockedSites.find(site => site._id === siteId);
      if (existing) {
        set({ currentSite: existing, isLoading: false });
        return existing;
      }
      // If getBlockedSiteById doesn't exist, just use existing data
      set({ currentSite: null, isLoading: false });
      return null;
    } catch (error) {
      set({ 
        error: error.message,
        isLoading: false 
      });
      throw error;
    }
  },

  // Add new blocked site
  addBlockedSite: async (userId, siteData) => {
    set({ isLoading: true, error: null });
    try {
      // Merge userId into siteData to match service signature
      const dataWithUserId = { ...siteData, userId };
      const newSite = await blockedSiteService.createBlockedSite(dataWithUserId);
      set((state) => ({ 
        blockedSites: [...state.blockedSites, newSite],
        isLoading: false,
        error: null 
      }));
      return newSite;
    } catch (error) {
      set({ 
        error: error.message,
        isLoading: false 
      });
      throw error;
    }
  },

  // Update blocked site
  updateBlockedSite: async (siteId, siteData) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await blockedSiteService.updateBlockedSite(siteId, siteData);
      set((state) => ({ 
        blockedSites: state.blockedSites.map(site => 
          site._id === siteId ? updated : site
        ),
        currentSite: state.currentSite?._id === siteId ? updated : state.currentSite,
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

  // Delete blocked site
  deleteBlockedSite: async (siteId) => {
    set({ isLoading: true, error: null });
    try {
      await blockedSiteService.deleteBlockedSite(siteId);
      set((state) => ({ 
        blockedSites: state.blockedSites.filter(site => site._id !== siteId),
        currentSite: state.currentSite?._id === siteId ? null : state.currentSite,
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

  // Clear current site
  clearCurrentSite: () => set({ currentSite: null }),

  // Reset store
  reset: () => set({
    blockedSites: [],
    currentSite: null,
    isLoading: false,
    error: null
  })
}));

export default useBlockedSiteStore;
