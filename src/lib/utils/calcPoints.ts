import { SCORING } from '@/lib/constants/scoring';
import type { Prediction } from '@/types/prediction';

export function calcPoints(
  prediction: Prediction,
  actual: { homeScore: number; awayScore: number; homeScorers?: string[]; awayScorers?: string[] },
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

  // +1 per correct scorer pick, -1 per incorrect pick (only when actual scorers are known)
  if (actual.homeScorers) {
    const actualSet = new Set(actual.homeScorers);
    for (const pick of (prediction.homeScorerPicks ?? [])) {
      pts += actualSet.has(pick) ? SCORING.CORRECT_SCORER : SCORING.WRONG_SCORER;
    }
  }
  if (actual.awayScorers) {
    const actualSet = new Set(actual.awayScorers);
    for (const pick of (prediction.awayScorerPicks ?? [])) {
      pts += actualSet.has(pick) ? SCORING.CORRECT_SCORER : SCORING.WRONG_SCORER;
    }
  }

  return pts;
}
