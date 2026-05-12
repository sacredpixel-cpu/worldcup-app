import type { Prediction } from '@/types/prediction';
import { GROUP_STAGE_MATCHES } from './matches';

// Seeded crowd averages — makes the community prediction bars non-empty from day 1
const SEED_SCORES: Record<string, [number, number][]> = {
  // Group A
  'GS-A-1': [[2,1],[1,0],[2,0],[1,1],[2,2],[0,1],[1,0],[2,1]],
  'GS-A-2': [[1,0],[0,1],[1,1],[2,0],[0,0],[1,2]],
  // Group C (big matches)
  'GS-C-1': [[2,1],[3,0],[2,0],[1,0],[2,1],[3,1]],
  // Group D (USA home)
  'GS-D-1': [[2,1],[2,0],[3,1],[1,0],[2,2],[1,1]],
  // Group E
  'GS-E-1': [[3,0],[2,1],[4,0],[3,1],[2,0]],
  // Group H
  'GS-H-1': [[3,0],[2,0],[4,1],[3,0],[2,1]],
  // Group I
  'GS-I-1': [[3,1],[2,0],[3,0],[4,1],[2,1]],
  // Group J (Argentina)
  'GS-J-2': [[3,0],[2,0],[4,1],[3,1],[2,0],[5,0]],
  // Group K (Portugal)
  'GS-K-1': [[3,0],[2,0],[3,1],[4,0],[2,1]],
  // Group L (England)
  'GS-L-1': [[2,0],[3,0],[2,1],[1,0],[3,1]],
};

let _id = 1000;
function fakeId() { return `mock-${_id++}`; }

export function getMockPredictions(): Prediction[] {
  const preds: Prediction[] = [];

  GROUP_STAGE_MATCHES.forEach((match) => {
    const seeds = SEED_SCORES[match.id];
    if (seeds) {
      seeds.forEach(([h, a]) => {
        preds.push({
          id: fakeId(),
          userId: `seed-${fakeId()}`,
          matchId: match.id,
          homeScore: h,
          awayScore: a,
          submittedAt: '2026-06-01T00:00:00Z',
          pointsEarned: null,
        });
      });
    } else {
      const count = 3 + Math.floor(Math.random() * 4);
      for (let i = 0; i < count; i++) {
        preds.push({
          id: fakeId(),
          userId: `seed-${fakeId()}`,
          matchId: match.id,
          homeScore: Math.floor(Math.random() * 4),
          awayScore: Math.floor(Math.random() * 3),
          submittedAt: '2026-06-01T00:00:00Z',
          pointsEarned: null,
        });
      }
    }
  });

  return preds;
}

export function getCrowdAverage(
  matchId: string,
  userPredictions: Prediction[],
): { homeAvg: number; awayAvg: number; count: number } | null {
  const mock = getMockPredictions().filter(p => p.matchId === matchId);
  const user = userPredictions.filter(p => p.matchId === matchId);
  const all = [...mock, ...user];
  if (all.length === 0) return null;
  const homeAvg = all.reduce((s, p) => s + p.homeScore, 0) / all.length;
  const awayAvg = all.reduce((s, p) => s + p.awayScore, 0) / all.length;
  return {
    homeAvg: Math.round(homeAvg * 10) / 10,
    awayAvg: Math.round(awayAvg * 10) / 10,
    count: all.length,
  };
}
