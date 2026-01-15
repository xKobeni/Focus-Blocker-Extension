import { create } from 'zustand';
import * as focusSessionService from '../services/focusSessionService';

const useFocusSessionStore = create((set, get) => ({
  // State
  sessions: [],
  activeSession: null,
  stats: null,
  isLoading: false,
  error: null,

  // Actions
  setLoading: (isLoading) => set({ isLoading }),
  
  setError: (error) => set({ error }),
  
  clearError: () => set({ error: null }),

  // Fetch all sessions for a user
  fetchSessions: async (userId) => {
    set({ isLoading: true, error: null });
    try {
      const sessions = await focusSessionService.getUserFocusSessions(userId);
      set({ 
        sessions,
        isLoading: false,
        error: null 
      });
      return sessions;
    } catch (error) {
      set({ 
        error: error.message,
        isLoading: false 
      });
      throw error;
    }
  },

  // Fetch active session
  fetchActiveSession: async (userId) => {
    try {
      const sessions = await focusSessionService.getActiveFocusSessions(userId);
      const active = sessions.length > 0 ? sessions[0] : null;
      set({ activeSession: active, error: null });
      return active;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  // Fetch session stats
  fetchSessionStats: async (userId) => {
    try {
      const stats = await focusSessionService.calculateSessionStats(userId);
      set({ stats, error: null });
      return stats;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  // Create new session
  createSession: async (userId, sessionData) => {
    set({ isLoading: true, error: null });
    try {
      const newSession = await focusSessionService.createFocusSession(userId, sessionData);
      set((state) => ({ 
        sessions: [newSession, ...state.sessions],
        activeSession: newSession,
        isLoading: false,
        error: null 
      }));
      return newSession;
    } catch (error) {
      set({ 
        error: error.message,
        isLoading: false 
      });
      throw error;
    }
  },

  // End session
  endSession: async (sessionId) => {
    set({ isLoading: true, error: null });
    try {
      const ended = await focusSessionService.endFocusSession(sessionId);
      set((state) => ({ 
        sessions: state.sessions.map(s => s._id === sessionId ? ended : s),
        activeSession: state.activeSession?._id === sessionId ? null : state.activeSession,
        isLoading: false,
        error: null 
      }));
      return ended;
    } catch (error) {
      set({ 
        error: error.message,
        isLoading: false 
      });
      throw error;
    }
  },

  // Update session
  updateSession: async (sessionId, sessionData) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await focusSessionService.updateFocusSession(sessionId, sessionData);
      set((state) => ({ 
        sessions: state.sessions.map(s => s._id === sessionId ? updated : s),
        activeSession: state.activeSession?._id === sessionId ? updated : state.activeSession,
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

  // Set active session directly
  setActiveSession: (session) => set({ activeSession: session }),

  // Clear active session
  clearActiveSession: () => set({ activeSession: null }),

  // Reset store
  reset: () => set({
    sessions: [],
    activeSession: null,
    stats: null,
    isLoading: false,
    error: null
  })
}));

export default useFocusSessionStore;
