import axios, { AxiosInstance, AxiosError } from 'axios';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || (() => {
  if (typeof window === 'undefined' || !(window as any).location) {
    return 'http://127.0.0.1:3000';
  }

  const hostname = (window as any).location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://127.0.0.1:3000';
  }

  return 'https://atmosbackend.vercel.app';
})();

// Log the API URL for debugging
console.log('[API] Base URL:', BASE_URL);

const ACCESS_TOKEN_KEY = 'atmos_access_token';
const REFRESH_TOKEN_KEY = 'atmos_refresh_token';

const memoryTokens: Record<string, string | null> = {
  [ACCESS_TOKEN_KEY]: null,
  [REFRESH_TOKEN_KEY]: null,
};

function isWeb(): boolean {
  return Platform.OS === 'web';
}

function getWebToken(key: string): string | null {
  try {
    if (typeof window === 'undefined') return memoryTokens[key] ?? null;
    return window.localStorage.getItem(key) ?? memoryTokens[key] ?? null;
  } catch {
    return memoryTokens[key] ?? null;
  }
}

function setWebToken(key: string, value: string | null): void {
  memoryTokens[key] = value;
  try {
    if (typeof window !== 'undefined') {
      if (value === null) window.localStorage.removeItem(key);
      else window.localStorage.setItem(key, value);
    }
  } catch {
    // Ignore storage failures on web private mode or locked-down browsers.
  }
}

// ─── Axios instance ───────────────────────────────────
const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Token helpers ────────────────────────────────────
export const TokenStore = {
  async getAccess(): Promise<string | null> {
    if (isWeb()) return getWebToken(ACCESS_TOKEN_KEY);
    return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  },
  async getRefresh(): Promise<string | null> {
    if (isWeb()) return getWebToken(REFRESH_TOKEN_KEY);
    return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  },
  async set(access: string, refresh: string): Promise<void> {
    if (isWeb()) {
      setWebToken(ACCESS_TOKEN_KEY, access);
      setWebToken(REFRESH_TOKEN_KEY, refresh);
      return;
    }
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, access);
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refresh);
  },
  async clear(): Promise<void> {
    if (isWeb()) {
      setWebToken(ACCESS_TOKEN_KEY, null);
      setWebToken(REFRESH_TOKEN_KEY, null);
      return;
    }
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  },
};

// ─── Request interceptor: attach token ───────────────
api.interceptors.request.use(async (config) => {
  const token = await TokenStore.getAccess();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── Response interceptor: refresh on 401 ────────────
let refreshing = false;
api.interceptors.response.use(
  (res) => res,
  async (err: AxiosError) => {
    const status = err.response?.status;
    
    // Log all API errors for debugging
    console.error('[API Error]', {
      url: err.config?.url,
      method: err.config?.method,
      status,
      message: err.message,
    });

    if (status === 401 && !refreshing) {
      refreshing = true;
      try {
        const refresh = await TokenStore.getRefresh();
        if (refresh) {
          const { data } = await axios.post(`${BASE_URL}/api/v1/auth/token/refresh`, { refreshToken: refresh });
          const oldRefresh = await TokenStore.getRefresh();
          await TokenStore.set(data.accessToken, oldRefresh || '');
          if (err.config) {
            err.config.headers.Authorization = `Bearer ${data.accessToken}`;
            return api.request(err.config);
          }
        }
      } catch (refreshErr) {
        console.error('[API] Token refresh failed');
        await TokenStore.clear();
      } finally {
        refreshing = false;
      }
    }
    return Promise.reject(err);
  }
);

// ─── API methods ──────────────────────────────────────
export const AuthAPI = {
  sendOTP: (phoneNumber: string, countryCode: string) =>
    api.post('/api/v1/auth/otp/send', { phoneNumber, countryCode }),

  verifyOTP: (phoneNumber: string, countryCode: string, otp: string, deviceFingerprint: string) =>
    api.post('/api/v1/auth/otp/verify', { phoneNumber, countryCode, otp, deviceFingerprint }),

  refreshToken: (refreshToken: string) =>
    api.post('/api/v1/auth/token/refresh', { refreshToken }),

  getMe: () => api.get('/api/v1/auth/me'),
};

export const ProjectsAPI = {
  create: (body: any) => api.post('/api/v1/projects', body),

  list: (params?: { page?: number; limit?: number; status?: string }) =>
    api.get('/api/v1/projects', { params }),

  get: (id: string) => api.get(`/api/v1/projects/${id}`),

  analyze: (id: string) => api.post(`/api/v1/projects/${id}/analyze`),

  mint: (id: string, listForSale: boolean, listPriceInr?: number) =>
    api.post(`/api/v1/projects/${id}/mint`, { listForSale, listPriceInr }),

  getProof: (id: string) => api.get(`/api/v1/projects/${id}/proof`),
};

export const MarketAPI = {
  listings: (params?: any) => api.get('/api/v1/marketplace', { params }),
  ticker:   ()             => api.get('/api/v1/marketplace/ticker'),
  createListing: (body: any) => api.post('/api/v1/marketplace/listings', body),
};

export const PaymentAPI = {
  createCheckout: (listingId: string, quantity: number) =>
    api.post('/api/v1/payments/checkout', { listingId, quantity }),

  getStatus: (sessionId: string) =>
    api.get(`/api/v1/payments/${sessionId}`),

  simulateSuccess: (sessionId: string) =>
    api.post(`/api/v1/payments/${sessionId}/simulate-success`),
};

export const PortfolioAPI = {
  get: () => api.get('/api/v1/portfolio'),
  retireCredits: (body: any) => api.post('/api/v1/credits/retire', body),
  certificates:  ()          => api.get('/api/v1/certificates'),
};

export const DashboardAPI = {
  get: () => api.get('/api/v1/dashboard'),
};

export const ZkAPI = {
  verify: (hash: string) => api.get(`/api/v1/proofs/${hash}/verify`),
};

export const HealthAPI = {
  check: () => api.get('/health'),
};

// ─── WebSocket helper ─────────────────────────────────
export function connectMRVWebSocket(
  projectId: string,
  token:     string,
  onEvent:   (step: string, data: any) => void
): WebSocket {
  const wsUrl = BASE_URL.replace(/^http/, 'ws') + `/ws?projectId=${projectId}&token=${token}`;
  const ws    = new WebSocket(wsUrl);

  ws.onmessage = (e) => {
    try {
      const msg = JSON.parse(e.data);
      onEvent(msg.event?.split(':')?.[1] || msg.event, msg.data);
    } catch { /* ignore parse errors */ }
  };

  ws.onerror = (e) => console.warn('WS error', e);
  return ws;
}

export default api;
