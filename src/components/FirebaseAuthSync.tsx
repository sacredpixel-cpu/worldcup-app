'use client';

import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuthStore } from '@/store';
import { saveUserProfile } from '@/lib/usersService';

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
        }).catch(console.error);
      } else {
        // No real Firebase session — clear any stale local state
        clearAuth();
      }
    });
    return () => unsubscribe();
  }, []);

  return null;
}
