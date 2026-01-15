import { create } from 'zustand';

const useUIStore = create((set) => ({
  // Modals
  modals: {
    challengeModal: false,
    settingsModal: false,
    confirmModal: false,
  },

  // Messages
  successMessage: null,
  errorMessage: null,
  infoMessage: null,

  // Loading states
  globalLoading: false,
  componentLoading: {},

  // Challenge Modal specific
  challengeModalData: null,

  // Confirm Modal specific
  confirmModalData: {
    title: '',
    message: '',
    onConfirm: null,
    onCancel: null,
  },

  // Modal Actions
  openModal: (modalName, data = null) => {
    set((state) => ({
      modals: { ...state.modals, [modalName]: true },
      [`${modalName}Data`]: data
    }));
  },

  closeModal: (modalName) => {
    set((state) => ({
      modals: { ...state.modals, [modalName]: false },
      [`${modalName}Data`]: null
    }));
  },

  closeAllModals: () => {
    set({
      modals: {
        challengeModal: false,
        settingsModal: false,
        confirmModal: false,
      },
      challengeModalData: null,
      confirmModalData: {
        title: '',
        message: '',
        onConfirm: null,
        onCancel: null,
      }
    });
  },

  // Message Actions
  setSuccessMessage: (message, duration = 3000) => {
    set({ successMessage: message });
    if (duration) {
      setTimeout(() => set({ successMessage: null }), duration);
    }
  },

  setErrorMessage: (message, duration = 5000) => {
    set({ errorMessage: message });
    if (duration) {
      setTimeout(() => set({ errorMessage: null }), duration);
    }
  },

  setInfoMessage: (message, duration = 3000) => {
    set({ infoMessage: message });
    if (duration) {
      setTimeout(() => set({ infoMessage: null }), duration);
    }
  },

  clearMessages: () => {
    set({
      successMessage: null,
      errorMessage: null,
      infoMessage: null
    });
  },

  // Loading Actions
  setGlobalLoading: (loading) => {
    set({ globalLoading: loading });
  },

  setComponentLoading: (componentName, loading) => {
    set((state) => ({
      componentLoading: {
        ...state.componentLoading,
        [componentName]: loading
      }
    }));
  },

  clearComponentLoading: (componentName) => {
    set((state) => {
      const { [componentName]: _, ...rest } = state.componentLoading;
      return { componentLoading: rest };
    });
  },

  // Confirm Modal Helper
  showConfirm: (title, message, onConfirm, onCancel = null) => {
    set({
      modals: { ...set.modals, confirmModal: true },
      confirmModalData: {
        title,
        message,
        onConfirm,
        onCancel
      }
    });
  },

  // Challenge Modal Helper
  showChallengeModal: (challengeData) => {
    set({
      modals: { ...set.modals, challengeModal: true },
      challengeModalData: challengeData
    });
  },

  // Reset store
  reset: () => set({
    modals: {
      challengeModal: false,
      settingsModal: false,
      confirmModal: false,
    },
    successMessage: null,
    errorMessage: null,
    infoMessage: null,
    globalLoading: false,
    componentLoading: {},
    challengeModalData: null,
    confirmModalData: {
      title: '',
      message: '',
      onConfirm: null,
      onCancel: null,
    }
  })
}));

export default useUIStore;
