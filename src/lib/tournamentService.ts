import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';
import type { TournamentPrediction, TournamentSettings } from '@/types/prediction';

/** Save (or update) a user's tournament picks */
export async function saveTournamentPick(
  userId: string,
  pick: Partial<Omit<TournamentPrediction, 'userId'>>,
): Promise<void> {
  const ref = doc(db, 'tournamentPicks', userId);
  await setDoc(ref, { ...pick, submittedAt: new Date().toISOString() }, { merge: true });
}

/** Load a user's tournament picks (one-time read) */
export async function getTournamentPick(userId: string): Promise<TournamentPrediction | null> {
  const ref = doc(db, 'tournamentPicks', userId);
  const snap = await getDoc(ref);
  return snap.exists() ? ({ userId, ...(snap.data() as Omit<TournamentPrediction, 'userId'>) }) : null;
}

/**
 * Subscribe to tournament-wide settings (e.g. golden boot winner announcement).
 * Admin writes to Firestore `tournament/settings` to reveal results.
 * Returns an unsubscribe function.
 */
export function subscribeToTournamentSettings(
  cb: (settings: TournamentSettings) => void,
): () => void {
  const ref = doc(db, 'tournament', 'settings');
  return onSnapshot(ref, (snap) => {
    cb(snap.exists() ? (snap.data() as TournamentSettings) : {});
  });
}
