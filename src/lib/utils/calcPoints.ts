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
