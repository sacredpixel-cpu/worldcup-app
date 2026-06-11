import { doc, setDoc, onSnapshot, collection, query, orderBy } from 'firebase/firestore';
import { db } from './firebase';

export interface GoalScorerEvent {
  player: string;
  teamCode: string;
  goals: number;
}

export interface MatchScoreUpdate {
  homeScore: number;
  awayScore: number;
  /** Score at 90 minutes — only set for knockout matches that went to ET/penalties */
  regularTimeHomeScore?: number | null;
  regularTimeAwayScore?: number | null;
  status: 'upcoming' | 'live' | 'finished';
  homeScorers?: string[];
  awayScorers?: string[];
  /** Per-match goal scorer events written by the live-score poller */
  goalScorerEvents?: GoalScorerEvent[];
}

export async function updateMatchScore(
  matchId: string,
  homeScore: number,
  awayScore: number,
  status: 'upcoming' | 'live' | 'finished',
  homeScorers?: string[],
  awayScorers?: string[],
  regularTimeHomeScore?: number | null,
  regularTimeAwayScore?: number | null,
): Promise<void> {
  const ref = doc(db, 'matches', matchId);
  const payload: Record<string, unknown> = { homeScore, awayScore, status };
  if (homeScorers) payload.homeScorers = homeScorers;
  if (awayScorers) payload.awayScorers = awayScorers;
  if (regularTimeHomeScore !== undefined) payload.regularTimeHomeScore = regularTimeHomeScore;
  if (regularTimeAwayScore !== undefined) payload.regularTimeAwayScore = regularTimeAwayScore;
  await setDoc(ref, payload, { merge: true });
}

// ─── Goal scorers ─────────────────────────────────────────────────────────────

export interface GoalScorer {
  /** Firestore document ID */
  id: string;
  player: string;
  team: string;
  teamCode: string;
  goals: number;
}

export async function upsertGoalScorer(
  scorerId: string,
  data: Omit<GoalScorer, 'id'>,
): Promise<void> {
  const ref = doc(db, 'goalScorers', scorerId);
  await setDoc(ref, data, { merge: true });
}

export async function deleteGoalScorer(scorerId: string): Promise<void> {
  const { deleteDoc } = await import('firebase/firestore');
  const ref = doc(db, 'goalScorers', scorerId);
  await deleteDoc(ref);
}

export function subscribeToGoalScorers(
  cb: (scorers: GoalScorer[]) => void,
): () => void {
  const ref = query(
    collection(db, 'goalScorers'),
    orderBy('goals', 'desc'),
  );
  return onSnapshot(ref, (snapshot) => {
    const scorers: GoalScorer[] = snapshot.docs.map(d => ({
      id: d.id,
      ...(d.data() as Omit<GoalScorer, 'id'>),
    }));
    cb(scorers);
  });
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
        regularTimeHomeScore: data.regularTimeHomeScore,
        regularTimeAwayScore: data.regularTimeAwayScore,
        status: data.status,
        homeScorers: data.homeScorers,
        awayScorers: data.awayScorers,
        goalScorerEvents: data.goalScorerEvents,
      };
    });
    cb(updates);
  });
}
