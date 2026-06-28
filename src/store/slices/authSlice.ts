'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { User } from '@/types/user';

interface FirebaseUser {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

interface AuthState {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
  loginWithGoogle: (firebaseUser: FirebaseUser) => void;
  loginWithEmail: (email: string, password: string, displayName?: string) => User;
  register: (email: string, password: string, displayName: string) => User;
  addPoints: (pts: number) => void;
  updateAvatar: (url: string) => void;
  updateDisplayName: (name: string) => void;
  updateLocation: (country: string, countryCode: string, state?: string) => void;
  loadProfileFromFirestore: (userId: string) => Promise<void>;
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

      loginWithGoogle: (firebaseUser) => {
        const existing = get().user;
        const isSameUser = existing?.id === firebaseUser.uid;
        const user: User = {
          id: firebaseUser.uid,
          // Preserve custom display name if already set; fall back to Firebase Auth name
          displayName: isSameUser && existing!.displayName ? existing!.displayName : (firebaseUser.displayName ?? firebaseUser.email?.split('@')[0] ?? 'User'),
          // Preserve custom avatar if already set; fall back to Google photo
          avatarUrl: isSameUser && existing!.avatarUrl ? existing!.avatarUrl : firebaseUser.photoURL,
          email: firebaseUser.email ?? '',
          totalPoints: isSameUser ? existing!.totalPoints : 0,
          globalRank: isSameUser ? existing!.globalRank : null,
          // Preserve location from cache
          country: isSameUser ? existing!.country : undefined,
          countryCode: isSameUser ? existing!.countryCode : undefined,
          state: isSameUser ? existing!.state : undefined,
        };
        set({ user, token: firebaseUser.uid });
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

      updateAvatar: (url) => {
        const { user } = get();
        if (!user) return;
        set({ user: { ...user, avatarUrl: url } });
        import('@/lib/usersService').then(({ saveUserProfile }) =>
          saveUserProfile({ userId: user.id, displayName: user.displayName, avatarUrl: url, country: user.country, countryCode: user.countryCode, state: user.state })
        ).catch(console.error);
      },

      updateDisplayName: (name) => {
        const { user } = get();
        if (!user) return;
        set({ user: { ...user, displayName: name } });
      },

      loadProfileFromFirestore: async (userId) => {
        try {
          const { getUserProfile } = await import('@/lib/usersService');
          const profile = await getUserProfile(userId);
          if (!profile) return;
          const { user } = get();
          if (!user || user.id !== userId) return;
          set({
            user: {
              ...user,
              displayName: profile.displayName ?? user.displayName,
              avatarUrl: profile.avatarUrl ?? user.avatarUrl,
              country: profile.country ?? user.country,
              countryCode: profile.countryCode ?? user.countryCode,
              state: profile.state ?? user.state,
            },
          });
        } catch (e) {
          console.error('loadProfileFromFirestore', e);
        }
      },

      updateLocation: (country, countryCode, state) => {
        const { user } = get();
        if (!user) return;
        const updated = { ...user, country, countryCode, state: state ?? undefined };
        set({ user: updated });
        import('@/lib/usersService').then(({ saveUserProfile }) =>
          saveUserProfile({ userId: user.id, displayName: user.displayName, avatarUrl: user.avatarUrl, country, countryCode, state })
        ).catch(console.error);
      },
    }),
    {
      name: 'wc2026-auth',
      storage: createJSONStorage(() => safeStorage),
    }
  )
);
