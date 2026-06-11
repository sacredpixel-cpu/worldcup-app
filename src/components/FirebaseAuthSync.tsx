'use client';

import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuthStore } from '@/store';
import { saveUserProfile } from '@/lib/usersService';
import { requestAndSaveToken, isNotificationSupported, needsPWAInstall } from '@/lib/notifications';

export function FirebaseAuthSync() {
  const { loginWithGoogle, clearAuth } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        loginWithGoogle(firebaseUser);
        // Persist user to Firestore so the fan count and leaderboard stay current.
        // saveUserProfile uses merge:true, so existing fields are preserved.
        saveUserProfile({
          userId: firebaseUser.uid,
          displayName: firebaseUser.displayName ?? firebaseUser.email?.split('@')[0] ?? 'User',
          avatarUrl: firebaseUser.photoURL ?? null,
          email: firebaseUser.email ?? undefined,
        }).catch(console.error);

        // If the user already granted notification permission (e.g. on a previous session
        // where the VAPID key was broken), silently re-register their FCM token now.
        if (
          isNotificationSupported() &&
          !needsPWAInstall() &&
          typeof Notification !== 'undefined' &&
          Notification.permission === 'granted'
        ) {
          requestAndSaveToken(firebaseUser.uid).catch(console.error);
        }
      } else {
        // No real Firebase session — clear any stale local state
        clearAuth();
      }
    });
    return () => unsubscribe();
  }, []);

  return null;
}
