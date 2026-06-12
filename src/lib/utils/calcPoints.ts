import { SCORING } from '@/lib/constants/scoring';
import type { Prediction } from '@/types/prediction';

export function calcPoints(
  prediction: Prediction,
  actual: { homeScore: number; awayScore: number; homeScorers?: string[]; awayScorers?: string[] },
): number {
  let pts = 0;

  // +3 per team score that's exactly correct (max +6)
  if (prediction.homeScore === actual.homeScore) pts += SCORING.CORRECT_SCORE_PER_TEAM;
  if (prediction.awayScore === actual.awayScore) pts += SCORING.CORRECT_SCORE_PER_TEAM;

  // +3 for correct outcome (W/D/L), -2 for wrong outcome — always applied
  const predictedOutcome = Math.sign(prediction.homeScore - prediction.awayScore);
  const actualOutcome    = Math.sign(actual.homeScore - actual.awayScore);
  if (predictedOutcome === actualOutcome) {
    pts += SCORING.CORRECT_OUTCOME;   // +3 correct outcome (stacks with exact score)
  } else {
    pts += SCORING.WRONG_OUTCOME;     // -2 wrong outcome
  }

  // +2 per goal scored by picked player (×goals if player scored multiple times)
  // -1 if picked player did not score at all
  // Only applied once actual scorers are known (post-match)
  // Accent-insensitive: "Raúl Jiménez" matches "Raul Jimenez" etc.
  const norm = (n: string) => n.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  const scorerPoints = (picks: string[], actualScorers: string[]) => {
    // Count how many goals each player scored (array may contain duplicates for multi-goal)
    const goalCounts = new Map<string, number>();
    for (const name of actualScorers) {
      const key = norm(name);
      goalCounts.set(key, (goalCounts.get(key) ?? 0) + 1);
    }
    for (const pick of picks) {
      const goals = goalCounts.get(norm(pick)) ?? 0;
      pts += goals > 0 ? goals * SCORING.CORRECT_SCORER : SCORING.WRONG_SCORER;
    }
  };

  if (actual.homeScorers) scorerPoints(prediction.homeScorerPicks ?? [], actual.homeScorers);
  if (actual.awayScorers) scorerPoints(prediction.awayScorerPicks ?? [], actual.awayScorers);

  return pts;
}
