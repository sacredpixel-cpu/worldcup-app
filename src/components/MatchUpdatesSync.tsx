'use client';

import { useEffect } from 'react';
import { useMatchesStore } from '@/store/slices/matchesSlice';

export function MatchUpdatesSync() {
  const { subscribeToUpdates } = useMatchesStore();

  useEffect(() => {
    const unsubscribe = subscribeToUpdates();
    return () => unsubscribe();
  }, []);

  return null;
}
