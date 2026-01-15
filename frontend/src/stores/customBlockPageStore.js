import { create } from 'zustand';
import * as customBlockPageService from '../services/customBlockPageService';

const useCustomBlockPageStore = create((set, get) => ({
  // State
  customPage: null,
  isLoading: false,
  error: null,

  // Actions
  setLoading: (isLoading) => set({ isLoading }),
  
  setError: (error) => set({ error }),
  
  clearError: () => set({ error: null }),

  // Fetch custom block page for a user
  fetchCustomPage: async (userId) => {
    set({ isLoading: true, error: null });
    try {
      const page = await customBlockPageService.getUserCustomBlockPage(userId);
      set({ 
        customPage: page,
        isLoading: false,
        error: null 
      });
      return page;
    } catch (error) {
      set({ 
        error: error.message,
        isLoading: false 
      });
      throw error;
    }
  },

  // Create custom block page
  createCustomPage: async (userId, pageData) => {
    set({ isLoading: true, error: null });
    try {
      const newPage = await customBlockPageService.createCustomBlockPage(userId, pageData);
      set({ 
        customPage: newPage,
        isLoading: false,
        error: null 
      });
      return newPage;
    } catch (error) {
      set({ 
        error: error.message,
        isLoading: false 
      });
      throw error;
    }
  },

  // Update custom block page
  updateCustomPage: async (pageId, pageData) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await customBlockPageService.updateCustomBlockPage(pageId, pageData);
      set({ 
        customPage: updated,
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

  // Delete custom block page
  deleteCustomPage: async (pageId) => {
    set({ isLoading: true, error: null });
    try {
      await customBlockPageService.deleteCustomBlockPage(pageId);
      set({ 
        customPage: null,
        isLoading: false,
        error: null 
      });
    } catch (error) {
      set({ 
        error: error.message,
        isLoading: false 
      });
      throw error;
    }
  },

  // Preview custom page
  previewCustomPage: (pageData) => {
    // This can be used to preview the custom page before saving
    return pageData;
  },

  // Clear custom page
  clearCustomPage: () => set({ customPage: null }),

  // Reset store
  reset: () => set({
    customPage: null,
    isLoading: false,
    error: null
  })
}));

export default useCustomBlockPageStore;
