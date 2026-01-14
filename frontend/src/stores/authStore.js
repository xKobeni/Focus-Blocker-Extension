import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import * as authService from '../services/authService';

const useAuthStore = create(
  persist(
    (set, get) => ({
      // State
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions
      setUser: (user) => set({ user, isAuthenticated: !!user, error: null }),
      
      setError: (error) => set({ error }),
      
      setLoading: (isLoading) => set({ isLoading }),

      // Register
      register: async ({ email, password, name }) => {
        set({ isLoading: true, error: null });
        try {
          const data = await authService.register({ email, password, name });
          set({ 
            user: data.user, 
            isAuthenticated: true, 
            isLoading: false,
            error: null 
          });
          return data;
        } catch (error) {
          set({ 
            error: error.message, 
            isLoading: false,
            isAuthenticated: false 
          });
          throw error;
        }
      },

      // Login
      login: async ({ email, password }) => {
        set({ isLoading: true, error: null });
        try {
          const data = await authService.login({ email, password });
          set({ 
            user: data.user, 
            isAuthenticated: true, 
            isLoading: false,
            error: null 
          });
          return data;
        } catch (error) {
          set({ 
            error: error.message, 
            isLoading: false,
            isAuthenticated: false 
          });
          throw error;
        }
      },

      // Logout
      logout: () => {
        authService.logout();
        set({ 
          user: null, 
          isAuthenticated: false, 
          error: null 
        });
      },

      // Fetch current user
      fetchUser: async () => {
        // Check if token exists first
        if (!authService.isAuthenticated()) {
          set({ user: null, isAuthenticated: false });
          return;
        }

        set({ isLoading: true, error: null });
        try {
          const userData = await authService.getCurrentUser();
          set({ 
            user: userData, 
            isAuthenticated: true, 
            isLoading: false,
            error: null 
          });
          return userData;
        } catch (error) {
          // If fetch fails, clear auth state
          authService.logout();
          set({ 
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: error.message 
          });
          throw error;
        }
      },

      // Verify token and sync state
      verifyAndSync: async () => {
        if (!authService.isAuthenticated()) {
          set({ user: null, isAuthenticated: false });
          return false;
        }

        try {
          const data = await authService.verifyToken();
          set({ 
            user: data.user, 
            isAuthenticated: true,
            error: null 
          });
          return true;
        } catch (error) {
          authService.logout();
          set({ 
            user: null, 
            isAuthenticated: false,
            error: null 
          });
          return false;
        }
      },

      // Clear error
      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage', // localStorage key
      partialize: (state) => ({ 
        user: state.user,
        isAuthenticated: state.isAuthenticated 
      }), // Only persist user and auth status
    }
  )
);

export default useAuthStore;
