'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/slices/authSlice';
import { usePredictionsStore } from '@/store/slices/predictionsSlice';

export function PredictionsSync() {
  const { user } = useAuthStore();
  const { syncSavedToFirestore, subscribeCommunity } = usePredictionsStore();

  // Subscribe to community predictions for real-time bar updates
  useEffect(() => {
    const unsub = subscribeCommunity();
    return () => unsub();
  }, []);

  // One-time sync of locally saved predictions to Firestore when user logs in
  useEffect(() => {
    if (user) {
      syncSavedToFirestore(user.id).catch(console.error);
    }
  }, [user?.id]);

  return null;
}
