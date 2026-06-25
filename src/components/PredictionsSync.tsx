'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/slices/authSlice';
import { usePredictionsStore } from '@/store/slices/predictionsSlice';

export function PredictionsSync() {
  const { user, loadProfileFromFirestore } = useAuthStore();
  const { syncSavedToFirestore, loadFromFirestore, pushLocalOnlyToFirestore, subscribeCommunity } = usePredictionsStore();

  // Subscribe to all community predictions for real-time bar updates
  useEffect(() => {
    const unsub = subscribeCommunity();
    return () => unsub();
  }, []);

  // On login:
  //   1. Restore profile (avatar, country, state) from Firestore
  //   2. Pull predictions from Firestore into local store (Firestore wins conflicts)
  //   3. One-time guest→account migration sync (only runs if not yet synced)
  //   4. Push any local-only predictions that never made it to Firestore (safe, no overwrites)
  useEffect(() => {
    if (!user) return;
    loadProfileFromFirestore(user.id).catch(console.error);
    loadFromFirestore(user.id)
      .then(() => syncSavedToFirestore(user.id))
      .then(() => pushLocalOnlyToFirestore(user.id))
      .catch(console.error);
  }, [user?.id]);

  // Re-run the upload check whenever the app comes back from background.
  // Covers the case where new code deployed while the app was minimized and
  // the login useEffect above never re-fired.
  useEffect(() => {
    if (!user) return;
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        pushLocalOnlyToFirestore(user.id).catch(console.error);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [user?.id]);

  return null;
}
