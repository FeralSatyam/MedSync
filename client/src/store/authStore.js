// client/src/store/authStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      login: (user, token) => {
        // console.log('Login called with token:', token);
        set({ user, token });
      },
      logout: () => {
        // console.log('Logout called');
        set({ user: null, token: null });
      },
      setUser: (user) => set({ user }),
    }),
    {
      name: 'medsync-auth',
    }
  )
);