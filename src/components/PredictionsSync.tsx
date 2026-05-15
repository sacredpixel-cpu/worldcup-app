'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/slices/authSlice';
import { usePredictionsStore } from '@/store/slices/predictionsSlice';

export function PredictionsSync() {
  const { user, loadProfileFromFirestore } = useAuthStore();
  const { syncSavedToFirestore, loadFromFirestore, subscribeCommunity } = usePredictionsStore();

  // Subscribe to all community predictions for real-time bar updates
  useEffect(() => {
    const unsub = subscribeCommunity();
    return () => unsub();
  }, []);

  // On login: restore full profile (avatar, country, state) + predictions from Firestore
  useEffect(() => {
    if (!user) return;
    loadProfileFromFirestore(user.id).catch(console.error);
    loadFromFirestore(user.id)
      .then(() => syncSavedToFirestore(user.id))
      .catch(console.error);
  }, [user?.id]);

  return null;
}
