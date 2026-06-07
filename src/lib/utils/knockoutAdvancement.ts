/**
 * knockoutAdvancement.ts
 *
 * Computes which real teams fill the R32 bracket slots based on actual
 * group-stage results fetched from Firestore (via useMatchesStore updates).
 *
 * Usage:
 *   const { updates } = useMatchesStore();
 *   const ktm = useMemo(() => computeKnockoutTeams(updates), [updates]);
 *   const { homeTeam, awayTeam } = resolveR32Teams('R32-07', ktm);
 */

import { GROUP_STAGE_MATCHES } from '@/data/matches';
import { GROUPS } from '@/data/teams';
import type { Team } from '@/types/match';

// ─── Types ────────────────────────────────────────────────────────────────────

interface GroupStanding {
  team: Team;
  pts: number;
  gf: number;
  ga: number;
}

export interface KnockoutTeamMap {
  /** Slot key → resolved Team. Keys like "W-A", "RU-A", "W-B", etc. */
  bySlot: Map<string, Team>;
  /**
   * Best 8 third-place teams (sorted by pts → GD → GF).
   * Indices 0–7 correspond to the 8 BEST3RD slots in R32 order:
   *   0 = R32-02 away, 1 = R32-05 away, 2 = R32-07 away, 3 = R32-08 away,
   *   4 = R32-09 away, 5 = R32-10 away, 6 = R32-13 away, 7 = R32-15 away
   */
  bestThirds: Team[];
  completedGroups: Set<string>;
  allGroupsComplete: boolean;
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

type MatchUpdateRecord = Record<
  string,
  { homeScore: number | null; awayScore: number | null; status: string }
>;

function buildGroupStandings(
  groupLetter: string,
  updates: MatchUpdateRecord,
): { standings: GroupStanding[]; complete: boolean } {
  const teams = GROUPS[groupLetter] ?? [];
  const standings: GroupStanding[] = teams.map(team => ({
    team, pts: 0, gf: 0, ga: 0,
  }));
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

  standings.sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    const gd = (b.gf - b.ga) - (a.gf - a.ga);
    if (gd !== 0) return gd;
    return b.gf - a.gf;
  });

  return { standings, complete: finishedCount === matches.length };
}

// ─── R32 slot mapping ─────────────────────────────────────────────────────────
// Each entry maps an R32 matchId → [homeSlotKey, awaySlotKey].
// "BEST3RD" entries are assigned sequentially in R32 order (R32-01 → R32-16).

export const R32_TEAM_SLOTS: Record<string, [string, string]> = {
  'R32-01': ['RU-A',    'RU-B'],
  'R32-02': ['W-E',     'BEST3RD'],   // BEST3RD index 0
  'R32-03': ['W-F',     'RU-C'],
  'R32-04': ['W-C',     'RU-F'],
  'R32-05': ['W-I',     'BEST3RD'],   // BEST3RD index 1
  'R32-06': ['RU-E',    'RU-I'],
  'R32-07': ['W-A',     'BEST3RD'],   // BEST3RD index 2
  'R32-08': ['W-L',     'BEST3RD'],   // BEST3RD index 3
  'R32-09': ['W-D',     'BEST3RD'],   // BEST3RD index 4
  'R32-10': ['W-G',     'BEST3RD'],   // BEST3RD index 5
  'R32-11': ['RU-K',    'RU-L'],
  'R32-12': ['W-H',     'RU-J'],
  'R32-13': ['W-B',     'BEST3RD'],   // BEST3RD index 6
  'R32-14': ['W-J',     'RU-H'],
  'R32-15': ['W-K',     'BEST3RD'],   // BEST3RD index 7
  'R32-16': ['RU-D',    'RU-G'],
};

// Sequential BEST3RD slot index for each R32 match's away position
const BEST3RD_IDX: Record<string, number> = {
  'R32-02': 0, 'R32-05': 1, 'R32-07': 2, 'R32-08': 3,
  'R32-09': 4, 'R32-10': 5, 'R32-13': 6, 'R32-15': 7,
};

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Computes the full knockout team map from live Firestore match updates.
 * Pass `updates` from `useMatchesStore().updates`.
 */
export function computeKnockoutTeams(updates: MatchUpdateRecord): KnockoutTeamMap {
  const bySlot = new Map<string, Team>();
  const completedGroups = new Set<string>();
  const thirds: Array<GroupStanding> = [];

  for (const letter of Object.keys(GROUPS)) {
    const { standings, complete } = buildGroupStandings(letter, updates);
    if (!complete) continue;

    completedGroups.add(letter);
    if (standings[0]) bySlot.set(`W-${letter}`,  standings[0].team);
    if (standings[1]) bySlot.set(`RU-${letter}`, standings[1].team);
    if (standings[2]) thirds.push(standings[2]);
  }

  // Best 8 third-place teams (only relevant once all 12 groups complete)
  thirds.sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    const gd = (b.gf - b.ga) - (a.gf - a.ga);
    if (gd !== 0) return gd;
    return b.gf - a.gf;
  });
  const bestThirds = thirds.slice(0, 8).map(t => t.team);

  return {
    bySlot,
    bestThirds,
    completedGroups,
    allGroupsComplete: completedGroups.size === Object.keys(GROUPS).length,
  };
}

/**
 * Resolves the home and away teams for an R32 match based on computed standings.
 * Returns null for each team if the relevant group hasn't finished yet.
 */
export function resolveR32Teams(
  matchId: string,
  ktm: KnockoutTeamMap,
): { homeTeam: Team | null; awayTeam: Team | null } {
  const slots = R32_TEAM_SLOTS[matchId];
  if (!slots) return { homeTeam: null, awayTeam: null };

  const [homeKey, awayKey] = slots;

  const resolveKey = (key: string, matchId: string): Team | null => {
    if (key === 'BEST3RD') {
      const idx = BEST3RD_IDX[matchId] ?? -1;
      // Only show best thirds once ALL groups are complete (assignment is total ordering)
      if (!ktm.allGroupsComplete) return null;
      return ktm.bestThirds[idx] ?? null;
    }
    return ktm.bySlot.get(key) ?? null;
  };

  return {
    homeTeam: resolveKey(homeKey, matchId),
    awayTeam: resolveKey(awayKey, matchId),
  };
}
