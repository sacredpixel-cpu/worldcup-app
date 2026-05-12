'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { User } from '@/types/user';

interface AuthState {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
  loginWithGoogle: () => void;
  loginWithEmail: (email: string, password: string, displayName?: string) => User;
  register: (email: string, password: string, displayName: string) => User;
  addPoints: (pts: number) => void;
}

const safeStorage = typeof window !== 'undefined'
  ? localStorage
  : { getItem: () => null, setItem: () => {}, removeItem: () => {} } as Storage;

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,

      setAuth: (user, token) => set({ user, token }),
      clearAuth: () => set({ user: null, token: null }),

      loginWithGoogle: () => {
        const id = uuidv4();
        const user: User = {
          id,
          displayName: 'Google User',
          avatarUrl: `https://i.pravatar.cc/150?u=${id}`,
          email: `user-${id.slice(0, 6)}@gmail.com`,
          totalPoints: 0,
          globalRank: null,
        };
        set({ user, token: `mock-token-${id}` });
      },

      loginWithEmail: (email, _password, displayName) => {
        const id = uuidv4();
        const user: User = {
          id,
          displayName: displayName ?? email.split('@')[0],
          avatarUrl: null,
          email,
          totalPoints: 0,
          globalRank: null,
        };
        set({ user, token: `mock-token-${id}` });
        return user;
      },

      register: (email, _password, displayName) => {
        const id = uuidv4();
        const user: User = {
          id,
          displayName,
          avatarUrl: null,
          email,
          totalPoints: 0,
          globalRank: null,
        };
        set({ user, token: `mock-token-${id}` });
        return user;
      },

      addPoints: (pts) => {
        const { user } = get();
        if (!user) return;
        set({ user: { ...user, totalPoints: user.totalPoints + pts } });
      },
    }),
    {
      name: 'wc2026-auth',
      storage: createJSONStorage(() => safeStorage),
    }
  )
);
