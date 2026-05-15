'use client';

import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuthStore } from '@/store';

export function FirebaseAuthSync() {
  const { loginWithGoogle, clearAuth } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        loginWithGoogle(firebaseUser);
      } else {
        // No real Firebase session — clear any stale local state
        // (handles old fake accounts and logged-out users)
        clearAuth();
      }
    });
    return () => unsubscribe();
  }, []);

  return null;
}
