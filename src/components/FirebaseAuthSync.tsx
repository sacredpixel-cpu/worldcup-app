'use client';

import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuthStore } from '@/store';

export function FirebaseAuthSync() {
  const { loginWithGoogle } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        loginWithGoogle(firebaseUser);
      }
    });
    return () => unsubscribe();
  }, []);

  return null;
}
