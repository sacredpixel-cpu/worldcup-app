import type { Match } from '@/types/match';

/**
 * Returns the score to use when grading a user's prediction.
 *
 * For knockout matches that went to extra time or a penalty shootout,
 * the regular-time score (score at 90 minutes) is what counts —
 * not the final ET result or shootout outcome.
 *
 * Returns null if the match hasn't been scored yet.
 */
export function getGradingScore(
  match: Pick<Match, 'homeScore' | 'awayScore' | 'regularTimeHomeScore' | 'regularTimeAwayScore'>,
): { homeScore: number; awayScore: number } | null {
  // Use the 90-minute score when available (knockout match that went to ET/pens)
  if (
    match.regularTimeHomeScore !== undefined &&
    match.regularTimeHomeScore !== null &&
    match.regularTimeAwayScore !== undefined &&
    match.regularTimeAwayScore !== null
  ) {
    return {
      homeScore: match.regularTimeHomeScore,
      awayScore: match.regularTimeAwayScore,
    };
  }

  // Fall back to the final score
  if (match.homeScore !== null && match.awayScore !== null) {
    return { homeScore: match.homeScore, awayScore: match.awayScore };
  }

  return null;
}
