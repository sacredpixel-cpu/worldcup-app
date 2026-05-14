'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/slices/authSlice';
import { usePredictionsStore } from '@/store/slices/predictionsSlice';

export function PredictionsSync() {
  const { user } = useAuthStore();
  const { syncSavedToFirestore, loadFromFirestore, subscribeCommunity } = usePredictionsStore();

  // Subscribe to all community predictions for real-time bar updates
  useEffect(() => {
    const unsub = subscribeCommunity();
    return () => unsub();
  }, []);

  // On login: load user's predictions from Firestore, then sync any local-only ones up
  useEffect(() => {
    if (!user) return;
    loadFromFirestore(user.id)
      .then(() => syncSavedToFirestore(user.id))
      .catch(console.error);
  }, [user?.id]);

  return null;
}
