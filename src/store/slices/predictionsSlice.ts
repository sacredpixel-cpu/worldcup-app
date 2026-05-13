'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { Prediction } from '@/types/prediction';
import { savePredictionToFirestore, saveAllPredictionsToFirestore, subscribeToCommunityPredictions } from '@/lib/predictionsService';

interface PredictionsState {
  saved: Record<string, Prediction>;
  draft: Record<string, { homeScore: number; awayScore: number }>;
  community: Prediction[];
  syncedToFirestore: boolean;

  setDraft: (matchId: string, home: number, away: number) => void;
  clearDraft: (matchId: string) => void;
  submitPrediction: (matchId: string, userId: string) => Prediction | null;
  getAllSaved: () => Prediction[];
  syncSavedToFirestore: (userId: string) => Promise<void>;
  subscribeCommunity: () => () => void;
}

const safeStorage = typeof window !== 'undefined'
  ? localStorage
  : { getItem: () => null, setItem: () => {}, removeItem: () => {} } as Storage;

export const usePredictionsStore = create<PredictionsState>()(
  persist(
    (set, get) => ({
      saved: {},
      draft: {},
      community: [],
      syncedToFirestore: false,

      setDraft: (matchId, home, away) =>
        set((s) => ({ draft: { ...s.draft, [matchId]: { homeScore: home, awayScore: away } } })),

      clearDraft: (matchId) =>
        set((s) => {
          const next = { ...s.draft };
          delete next[matchId];
          return { draft: next };
        }),

      submitPrediction: (matchId, userId) => {
        const { draft } = get();
        const d = draft[matchId];
        if (!d) return null;
        const prediction: Prediction = {
          id: uuidv4(),
          userId,
          matchId,
          homeScore: d.homeScore,
          awayScore: d.awayScore,
          submittedAt: new Date().toISOString(),
          pointsEarned: null,
        };
        set((s) => ({
          saved: { ...s.saved, [matchId]: prediction },
          draft: (() => { const n = { ...s.draft }; delete n[matchId]; return n; })(),
        }));
        // Fire-and-forget save to Firestore
        savePredictionToFirestore(prediction).catch(console.error);
        return prediction;
      },

      getAllSaved: () => Object.values(get().saved),

      // Upload all locally saved predictions to Firestore (one-time sync for existing users)
      syncSavedToFirestore: async (userId) => {
        const { saved, syncedToFirestore } = get();
        if (syncedToFirestore) return;
        const predictions = Object.values(saved).filter(p => p.userId === userId);
        if (predictions.length === 0) return;
        await saveAllPredictionsToFirestore(predictions);
        set({ syncedToFirestore: true });
      },

      subscribeCommunity: () => {
        return subscribeToCommunityPredictions((predictions) => {
          set({ community: predictions });
        });
      },
    }),
    {
      name: 'wc2026-predictions',
      storage: createJSONStorage(() => safeStorage),
      partialize: (s) => ({ saved: s.saved, syncedToFirestore: s.syncedToFirestore }),
    }
  )
);
