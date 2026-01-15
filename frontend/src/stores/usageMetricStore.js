import { create } from 'zustand';
import * as usageMetricService from '../services/usageMetricService';

const useUsageMetricStore = create((set, get) => ({
  // State
  metrics: [],
  currentMetric: null,
  stats: null,
  isLoading: false,
  error: null,

  // Actions
  setLoading: (isLoading) => set({ isLoading }),
  
  setError: (error) => set({ error }),
  
  clearError: () => set({ error: null }),

  // Fetch usage metrics for a user
  fetchMetrics: async (userId, options = {}) => {
    set({ isLoading: true, error: null });
    try {
      const metrics = await usageMetricService.getUserUsageMetrics(userId, options);
      set({ 
        metrics,
        isLoading: false,
        error: null 
      });
      return metrics;
    } catch (error) {
      set({ 
        error: error.message,
        isLoading: false 
      });
      throw error;
    }
  },

  // Fetch single metric
  fetchMetric: async (metricId) => {
    set({ isLoading: true, error: null });
    try {
      const metric = await usageMetricService.getUsageMetricById(metricId);
      set({ 
        currentMetric: metric,
        isLoading: false,
        error: null 
      });
      return metric;
    } catch (error) {
      set({ 
        error: error.message,
        isLoading: false 
      });
      throw error;
    }
  },

  // Fetch usage statistics
  fetchStats: async (userId, options = {}) => {
    set({ isLoading: true, error: null });
    try {
      const stats = await usageMetricService.getUserUsageStats(userId, options);
      set({ 
        stats,
        isLoading: false,
        error: null 
      });
      return stats;
    } catch (error) {
      set({ 
        error: error.message,
        isLoading: false 
      });
      throw error;
    }
  },

  // Create new metric
  createMetric: async (userId, metricData) => {
    set({ isLoading: true, error: null });
    try {
      const newMetric = await usageMetricService.createUsageMetric(userId, metricData);
      set((state) => ({ 
        metrics: [newMetric, ...state.metrics],
        isLoading: false,
        error: null 
      }));
      return newMetric;
    } catch (error) {
      set({ 
        error: error.message,
        isLoading: false 
      });
      throw error;
    }
  },

  // Update metric
  updateMetric: async (metricId, metricData) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await usageMetricService.updateUsageMetric(metricId, metricData);
      set((state) => ({ 
        metrics: state.metrics.map(metric => 
          metric._id === metricId ? updated : metric
        ),
        currentMetric: state.currentMetric?._id === metricId ? updated : state.currentMetric,
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

  // Delete metric
  deleteMetric: async (metricId) => {
    set({ isLoading: true, error: null });
    try {
      await usageMetricService.deleteUsageMetric(metricId);
      set((state) => ({ 
        metrics: state.metrics.filter(metric => metric._id !== metricId),
        currentMetric: state.currentMetric?._id === metricId ? null : state.currentMetric,
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

  // Track site visit
  trackSiteVisit: async (userId, domain, duration) => {
    try {
      const metric = await usageMetricService.trackSiteVisit(userId, domain, duration);
      return metric;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  // Get top sites
  getTopSites: async (userId, limit = 10) => {
    try {
      const topSites = await usageMetricService.getTopSites(userId, limit);
      return topSites;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  // Clear current metric
  clearCurrentMetric: () => set({ currentMetric: null }),

  // Reset store
  reset: () => set({
    metrics: [],
    currentMetric: null,
    stats: null,
    isLoading: false,
    error: null
  })
}));

export default useUsageMetricStore;
