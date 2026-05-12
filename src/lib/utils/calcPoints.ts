import { SCORING } from '@/lib/constants/scoring';
import type { Prediction } from '@/types/prediction';

export function calcPoints(
  prediction: Prediction,
  actual: { homeScore: number; awayScore: number },
): number {
  const exact =
    prediction.homeScore === actual.homeScore &&
    prediction.awayScore === actual.awayScore;

  if (exact) return SCORING.CORRECT_SCORE;

  const predictedOutcome = Math.sign(prediction.homeScore - prediction.awayScore);
  const actualOutcome = Math.sign(actual.homeScore - actual.awayScore);

  if (predictedOutcome === actualOutcome) return SCORING.CORRECT_OUTCOME;

  return 0;
}
