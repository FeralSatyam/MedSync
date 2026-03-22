import { create } from 'zustand';
import { getMe } from '../api/authApi';

const TOKEN_KEY = 'medsync_token';

export const useAuthStore = create((set, get) => ({
  user: null,
  token: typeof localStorage !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null,
  hydrated: false,
  loading: false,

  setAuth: (user, token) => {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
    set({ user, token });
  },

  clearAuth: () => {
    localStorage.removeItem(TOKEN_KEY);
    set({ user: null, token: null });
  },

  hydrate: async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      set({ hydrated: true, user: null });
      return;
    }
    set({ loading: true });
    try {
      const data = await getMe();
      set({ user: data.user, token, hydrated: true, loading: false });
    } catch {
      localStorage.removeItem(TOKEN_KEY);
      set({ user: null, token: null, hydrated: true, loading: false });
    }
  },
}));

if (typeof window !== 'undefined') {
  window.addEventListener('medsync:logout', () => {
    useAuthStore.getState().clearAuth();
  });
}
