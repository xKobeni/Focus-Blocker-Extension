import { create } from 'zustand';
import * as scheduleService from '../services/scheduleService';

const useScheduleStore = create((set, get) => ({
  // State
  schedules: [],
  currentSchedule: null,
  isLoading: false,
  error: null,

  // Actions
  setLoading: (isLoading) => set({ isLoading }),
  
  setError: (error) => set({ error }),
  
  clearError: () => set({ error: null }),

  // Fetch all schedules for a user
  fetchSchedules: async (userId) => {
    set({ isLoading: true, error: null });
    try {
      const schedules = await scheduleService.getUserSchedules(userId);
      set({ 
        schedules,
        isLoading: false,
        error: null 
      });
      return schedules;
    } catch (error) {
      set({ 
        error: error.message,
        isLoading: false 
      });
      throw error;
    }
  },

  // Get single schedule (optional - not critical)
  fetchSchedule: async (scheduleId) => {
    set({ isLoading: true, error: null });
    try {
      // Find in existing schedules first
      const existing = get().schedules.find(schedule => schedule._id === scheduleId);
      if (existing) {
        set({ currentSchedule: existing, isLoading: false });
        return existing;
      }
      set({ currentSchedule: null, isLoading: false });
      return null;
    } catch (error) {
      set({ 
        error: error.message,
        isLoading: false 
      });
      throw error;
    }
  },

  // Create new schedule
  createSchedule: async (userId, scheduleData) => {
    set({ isLoading: true, error: null });
    try {
      // Merge userId into scheduleData to match service signature
      const dataWithUserId = { ...scheduleData, userId };
      const newSchedule = await scheduleService.createSchedule(dataWithUserId);
      set((state) => ({ 
        schedules: [...state.schedules, newSchedule],
        isLoading: false,
        error: null 
      }));
      return newSchedule;
    } catch (error) {
      set({ 
        error: error.message,
        isLoading: false 
      });
      throw error;
    }
  },

  // Update schedule
  updateSchedule: async (scheduleId, scheduleData) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await scheduleService.updateSchedule(scheduleId, scheduleData);
      set((state) => ({ 
        schedules: state.schedules.map(schedule => 
          schedule._id === scheduleId ? updated : schedule
        ),
        currentSchedule: state.currentSchedule?._id === scheduleId ? updated : state.currentSchedule,
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

  // Delete schedule
  deleteSchedule: async (scheduleId) => {
    set({ isLoading: true, error: null });
    try {
      await scheduleService.deleteSchedule(scheduleId);
      set((state) => ({ 
        schedules: state.schedules.filter(schedule => schedule._id !== scheduleId),
        currentSchedule: state.currentSchedule?._id === scheduleId ? null : state.currentSchedule,
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

  // Check active schedules
  checkActiveSchedules: async (userId) => {
    try {
      const active = await scheduleService.getActiveSchedules(userId);
      return active;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  // Clear current schedule
  clearCurrentSchedule: () => set({ currentSchedule: null }),

  // Reset store
  reset: () => set({
    schedules: [],
    currentSchedule: null,
    isLoading: false,
    error: null
  })
}));

export default useScheduleStore;
