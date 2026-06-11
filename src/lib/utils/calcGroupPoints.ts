import { SCORING } from '@/lib/constants/scoring';
import { GROUP_STAGE_MATCHES } from '@/data/matches';
import { GROUPS } from '@/data/teams';
import type { Team } from '@/types/match';
import type { Prediction } from '@/types/prediction';

interface Standing {
  team: Team;
  pts: number;
  gf: number;
  ga: number;
}

type MatchUpdateRecord = Record<
  string,
  { homeScore: number | null; awayScore: number | null; status: string }
>;

function sortStandings(standings: Standing[]): Standing[] {
  return [...standings].sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    const gdDiff = (b.gf - b.ga) - (a.gf - a.ga);
    if (gdDiff !== 0) return gdDiff;
    return b.gf - a.gf;
  });
}

/**
 * Build actual standings from Firestore live data merged with static match data.
 * Returns null if the group is not fully complete yet.
 */
function buildActualStandings(
  groupLetter: string,
  updates: MatchUpdateRecord,
): Standing[] | null {
  const teams = GROUPS[groupLetter] ?? [];
  const standings: Standing[] = teams.map(team => ({ team, pts: 0, gf: 0, ga: 0 }));
  const byId = Object.fromEntries(standings.map(s => [s.team.id, s]));

  const matches = GROUP_STAGE_MATCHES.filter(m => m.homeTeam.group === groupLetter);
  let finishedCount = 0;

  for (const match of matches) {
    const upd = updates[match.id];
    const homeScore = upd?.homeScore ?? match.homeScore;
    const awayScore  = upd?.awayScore  ?? match.awayScore;
    const status     = upd?.status     ?? match.status;

    if (status !== 'finished' || homeScore === null || awayScore === null) continue;
    finishedCount++;

    const home = byId[match.homeTeam.id];
    const away = byId[match.awayTeam.id];
    if (!home || !away) continue;

    home.gf += homeScore; home.ga += awayScore;
    away.gf += awayScore; away.ga += homeScore;

    if (homeScore > awayScore)      { home.pts += 3; }
    else if (homeScore < awayScore) { away.pts += 3; }
    else                            { home.pts++;  away.pts++; }
  }

  if (finishedCount < matches.length) return null; // group not fully played yet

  return sortStandings(standings);
}

/** Build predicted standings from user's saved predictions. Returns null if user hasn't predicted all 6. */
function buildPredictedStandings(groupLetter: string, saved: Record<string, Prediction>): Standing[] | null {
  const teams = GROUPS[groupLetter] ?? [];
  const standings: Standing[] = teams.map(team => ({ team, pts: 0, gf: 0, ga: 0 }));
  const byId = Object.fromEntries(standings.map(s => [s.team.id, s]));

  const matches = GROUP_STAGE_MATCHES.filter(m => m.homeTeam.group === groupLetter);
  let predictedCount = 0;

  matches.forEach(m => {
    const pred = saved[m.id];
    if (!pred) return;
    predictedCount++;
    const home = byId[m.homeTeam.id];
    const away = byId[m.awayTeam.id];
    if (!home || !away) return;
    home.gf += pred.homeScore; home.ga += pred.awayScore;
    away.gf += pred.awayScore; away.ga += pred.homeScore;
    if (pred.homeScore > pred.awayScore) { home.pts += 3; }
    else if (pred.homeScore < pred.awayScore) { away.pts += 3; }
    else { home.pts++; away.pts++; }
  });

  if (predictedCount < matches.length) return null; // user hasn't predicted all matches

  return sortStandings(standings);
}

export interface GroupPointsResult {
  groupLetter: string;
  points: number;
  winnerCorrect: boolean;
  runnerUpCorrect: boolean;
  thirdCorrect: boolean;
}

/**
 * Calculate group-advancement prediction points for a user.
 * Only scores groups where ALL matches are finished AND the user predicted ALL matches.
 *
 * +3 for correct group winner
 * +2 for correct runner-up
 * +1 for correct 3rd-place finisher
 *
 * @param saved   - user's saved predictions (matchId → Prediction)
 * @param updates - live Firestore match updates from useMatchesStore().updates
 */
export function calcGroupPoints(
  saved: Record<string, Prediction>,
  updates: MatchUpdateRecord = {},
): {
  results: GroupPointsResult[];
  total: number;
} {
  const results: GroupPointsResult[] = [];
  let total = 0;

  Object.keys(GROUPS).forEach(letter => {
    const actual = buildActualStandings(letter, updates);
    const predicted = buildPredictedStandings(letter, saved);

    if (!actual || !predicted) return; // skip if group unfinished or user hasn't predicted all

    const winnerCorrect = actual[0]?.team.id === predicted[0]?.team.id;
    const runnerUpCorrect = actual[1]?.team.id === predicted[1]?.team.id;
    const thirdCorrect = actual[2]?.team.id === predicted[2]?.team.id;

    let pts = 0;
    if (winnerCorrect) pts += SCORING.CORRECT_GROUP_WINNER;
    if (runnerUpCorrect) pts += SCORING.CORRECT_GROUP_RUNNER_UP;
    if (thirdCorrect) pts += SCORING.CORRECT_GROUP_THIRD;

    results.push({ groupLetter: letter, points: pts, winnerCorrect, runnerUpCorrect, thirdCorrect });
    total += pts;
  });

  return { results, total };
}
