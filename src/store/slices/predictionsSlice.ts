'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { Prediction } from '@/types/prediction';
import { savePredictionToFirestore, saveAllPredictionsToFirestore, getUserPredictions, subscribeToCommunityPredictions } from '@/lib/predictionsService';

async function saveWithRetry(prediction: Prediction, attempts = 3): Promise<void> {
  for (let i = 0; i < attempts; i++) {
    try {
      await savePredictionToFirestore(prediction);
      return;
    } catch (err) {
      if (i === attempts - 1) console.error('Failed to save prediction after retries:', err);
      else await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
}

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
  pushLocalOnlyToFirestore: (userId: string) => Promise<void>;
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
        // Save with retry — 3 attempts with backoff so transient failures don't silently drop data
        saveWithRetry(prediction);
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

      // Upload predictions that exist locally but are absent from Firestore.
      // Checks ALL local predictions regardless of userId — re-stamps each with the
      // current userId before uploading. This catches predictions made as a guest
      // that were never migrated (syncSavedToFirestore only runs once per device).
      // Safe to run on every login — never overwrites existing Firestore documents.
      pushLocalOnlyToFirestore: async (userId) => {
        const { saved } = get();
        const allLocal = Object.values(saved);
        if (allLocal.length === 0) return;
        const firestorePreds = await getUserPredictions(userId);
        const firestoreMatchIds = new Set(firestorePreds.map(p => p.matchId));
        const missing = allLocal
          .filter(p => !firestoreMatchIds.has(p.matchId))
          .map(p => ({ ...p, userId })); // re-stamp with current userId
        if (missing.length === 0) return;
        await saveAllPredictionsToFirestore(missing);
        // Fix local state so userId is consistent going forward
        const updated: Record<string, Prediction> = {};
        for (const p of missing) updated[p.matchId] = p;
        set((s) => ({ saved: { ...s.saved, ...updated } }));
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
