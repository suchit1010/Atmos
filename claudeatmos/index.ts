import { create } from 'zustand';
import { TokenStore, AuthAPI } from '../services/api';

// ─── Types ────────────────────────────────────────────
export interface User {
  id:           string;
  phone:        string;
  name:         string | null;
  role:         string;
  kycStatus:    string;
  organisation: string | null;
  walletAddress:string | null;
}

export interface Project {
  id:              string;
  entityType:      string;
  name:            string;
  status:          string;
  co2eEstimated:   number | null;
  confidenceScore: number | null;
  grade:           string | null;
  proofHash:       string | null;
  mintAddress:     string | null;
  lat:             number;
  lng:             number;
  createdAt:       string;
}

export interface AuthState {
  user:           User | null;
  isLoggedIn:     boolean;
  isLoading:      boolean;
  login:          (user: User, access: string, refresh: string) => Promise<void>;
  logout:         () => Promise<void>;
  loadFromStorage: () => Promise<void>;
  updateUser:     (updates: Partial<User>) => void;
}

export interface UIState {
  theme:       'dark' | 'light';
  language:    string;
  currency:    string;
  toggleTheme: () => void;
  setLanguage: (lang: string) => void;
  setCurrency: (cur: string) => void;
}

export interface MRVState {
  pipelineStep:   string;
  pipelineData:   Record<string, any>;
  isRunning:      boolean;
  setStep:        (step: string, data?: any) => void;
  reset:          () => void;
}

// ─── Auth Store ───────────────────────────────────────
export const useAuthStore = create<AuthState>((set) => ({
  user:      null,
  isLoggedIn: false,
  isLoading:  true,

  login: async (user, access, refresh) => {
    await TokenStore.set(access, refresh);
    set({ user, isLoggedIn: true });
  },

  logout: async () => {
    await TokenStore.clear();
    set({ user: null, isLoggedIn: false });
  },

  loadFromStorage: async () => {
    const token = await TokenStore.getAccess();
    if (!token) {
      set({ isLoading: false });
      return;
    }
    try {
      const { data } = await AuthAPI.getMe();
      set({ user: data, isLoggedIn: true, isLoading: false });
    } catch {
      await TokenStore.clear();
      set({ isLoading: false });
    }
  },

  updateUser: (updates) =>
    set((s) => ({ user: s.user ? { ...s.user, ...updates } : null })),
}));

// ─── UI Store ─────────────────────────────────────────
export const useUIStore = create<UIState>((set) => ({
  theme:    'dark',
  language: 'en',
  currency: 'INR',

  toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
  setLanguage: (language) => set({ language }),
  setCurrency: (currency) => set({ currency }),
}));

// ─── MRV Pipeline Store ───────────────────────────────
export const useMRVStore = create<MRVState>((set) => ({
  pipelineStep: '',
  pipelineData: {},
  isRunning:    false,

  setStep: (step, data = {}) =>
    set((s) => ({
      pipelineStep: step,
      pipelineData: { ...s.pipelineData, [step]: data },
      isRunning:    !['verified', 'minted', 'failed', 'rejected'].includes(step),
    })),

  reset: () => set({ pipelineStep: '', pipelineData: {}, isRunning: false }),
}));
