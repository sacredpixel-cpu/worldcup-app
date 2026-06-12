'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { Prediction } from '@/types/prediction';
import { savePredictionToFirestore, saveAllPredictionsToFirestore, getUserPredictions, subscribeToCommunityPredictions } from '@/lib/predictionsService';

interface DraftEntry {
  homeScore: number;
  awayScore: number;
  homeScorerPicks: string[];
  awayScorerPicks: string[];
}

interface PredictionsState {
  saved: Record<string, Prediction>;
  draft: Record<string, DraftEntry>;
  community: Prediction[];
  syncedToFirestore: boolean;

  setDraft: (matchId: string, home: number, away: number, homePicks?: string[], awayPicks?: string[]) => void;
  clearDraft: (matchId: string) => void;
  submitPrediction: (matchId: string, userId: string) => Prediction | null;
  getAllSaved: () => Prediction[];
  syncSavedToFirestore: (userId: string) => Promise<void>;
  loadFromFirestore: (userId: string) => Promise<void>;
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

      setDraft: (matchId, home, away, homePicks?, awayPicks?) =>
        set((s) => ({
          draft: {
            ...s.draft,
            [matchId]: {
              homeScore: home,
              awayScore: away,
              homeScorerPicks: homePicks ?? s.draft[matchId]?.homeScorerPicks ?? [],
              awayScorerPicks: awayPicks ?? s.draft[matchId]?.awayScorerPicks ?? [],
            },
          },
        })),

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
          homeScorerPicks: d.homeScorerPicks ?? [],
          awayScorerPicks: d.awayScorerPicks ?? [],
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

      // Upload all locally saved predictions to Firestore (one-time sync on first login).
      // Re-stamps every prediction with the current userId so guest predictions made
      // before login get correctly attributed to the logged-in Firebase account.
      syncSavedToFirestore: async (userId) => {
        const { saved, syncedToFirestore } = get();
        if (syncedToFirestore) return;
        const allPredictions = Object.values(saved);
        if (allPredictions.length === 0) { set({ syncedToFirestore: true }); return; }
        // Re-attribute all predictions to the current userId (handles guest → logged-in migration)
        const stamped = allPredictions.map(p => ({ ...p, userId }));
        await saveAllPredictionsToFirestore(stamped);
        // Update local state so userId is consistent going forward
        const updated: Record<string, Prediction> = {};
        stamped.forEach(p => { updated[p.matchId] = p; });
        set({ saved: { ...get().saved, ...updated }, syncedToFirestore: true });
      },

      // Load user's predictions from Firestore into saved state (restores after logout/new device)
      loadFromFirestore: async (userId) => {
        const predictions = await getUserPredictions(userId);
        if (predictions.length === 0) return;
        const saved: Record<string, Prediction> = {};
        predictions.forEach(p => { saved[p.matchId] = p; });
        // Merge with any local predictions, Firestore wins on conflict
        set((s) => ({ saved: { ...s.saved, ...saved }, syncedToFirestore: true }));
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
