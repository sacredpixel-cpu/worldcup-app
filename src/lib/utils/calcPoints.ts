import { SCORING } from '@/lib/constants/scoring';
import type { Prediction } from '@/types/prediction';

export function calcPoints(
  prediction: Prediction,
  actual: { homeScore: number; awayScore: number },
): number {
  let pts = 0;

  // 5 points per team score that's exactly correct (max 10)
  if (prediction.homeScore === actual.homeScore) pts += SCORING.CORRECT_SCORE_PER_TEAM;
  if (prediction.awayScore === actual.awayScore) pts += SCORING.CORRECT_SCORE_PER_TEAM;

  // If neither score is exact, check for correct outcome (W/D/L)
  if (pts === 0) {
    const predictedOutcome = Math.sign(prediction.homeScore - prediction.awayScore);
    const actualOutcome = Math.sign(actual.homeScore - actual.awayScore);
    if (predictedOutcome === actualOutcome) pts = SCORING.CORRECT_OUTCOME;
  }

  return pts;
}
