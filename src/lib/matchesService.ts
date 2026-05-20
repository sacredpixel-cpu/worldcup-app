import { doc, setDoc, onSnapshot, collection } from 'firebase/firestore';
import { db } from './firebase';

export interface MatchScoreUpdate {
  homeScore: number;
  awayScore: number;
  status: 'upcoming' | 'live' | 'finished';
}

export async function updateMatchScore(
  matchId: string,
  homeScore: number,
  awayScore: number,
  status: 'upcoming' | 'live' | 'finished'
): Promise<void> {
  const ref = doc(db, 'matches', matchId);
  await setDoc(ref, { homeScore, awayScore, status }, { merge: true });
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
      };
    });
    cb(updates);
  });
}
