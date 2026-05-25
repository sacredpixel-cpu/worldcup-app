import { doc, setDoc, onSnapshot, collection } from 'firebase/firestore';
import { db } from './firebase';

export interface MatchScoreUpdate {
  homeScore: number;
  awayScore: number;
  status: 'upcoming' | 'live' | 'finished';
  homeScorers?: string[];
  awayScorers?: string[];
}

export async function updateMatchScore(
  matchId: string,
  homeScore: number,
  awayScore: number,
  status: 'upcoming' | 'live' | 'finished',
  homeScorers?: string[],
  awayScorers?: string[],
): Promise<void> {
  const ref = doc(db, 'matches', matchId);
  const payload: Record<string, unknown> = { homeScore, awayScore, status };
  if (homeScorers) payload.homeScorers = homeScorers;
  if (awayScorers) payload.awayScorers = awayScorers;
  await setDoc(ref, payload, { merge: true });
}

export function subscribeToMatchUpdates(
  cb: (updates: Record<string, MatchScoreUpdate>) => void
): () => void {
  const ref = collection(db, 'matches');
  return onSnapshot(ref, (snapshot) => {
    const updates: Record<string, MatchScoreUpdate> = {};
    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as MatchScoreUpdate;
      updates[docSnap.id] = {
        homeScore: data.homeScore,
        awayScore: data.awayScore,
        status: data.status,
        homeScorers: data.homeScorers,
        awayScorers: data.awayScorers,
      };
    });
    cb(updates);
  });
}
