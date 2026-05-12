'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { Prediction } from '@/types/prediction';

interface PredictionsState {
  // Persisted submitted predictions
  saved: Record<string, Prediction>; // matchId → submitted prediction
  // In-progress draft inputs
  draft: Record<string, { homeScore: number; awayScore: number }>;

  setDraft: (matchId: string, home: number, away: number) => void;
  clearDraft: (matchId: string) => void;
  submitPrediction: (matchId: string, userId: string) => Prediction | null;
  getAllSaved: () => Prediction[];
}

const safeStorage = typeof window !== 'undefined'
  ? localStorage
  : { getItem: () => null, setItem: () => {}, removeItem: () => {} } as Storage;

export const usePredictionsStore = create<PredictionsState>()(
  persist(
    (set, get) => ({
      saved: {},
      draft: {},

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
        return prediction;
      },

      getAllSaved: () => Object.values(get().saved),
    }),
    {
      name: 'wc2026-predictions',
      storage: createJSONStorage(() => safeStorage),
      partialize: (s) => ({ saved: s.saved }),
    }
  )
);
