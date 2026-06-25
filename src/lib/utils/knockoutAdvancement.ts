/**
 * knockoutAdvancement.ts
 *
 * Computes which real teams fill knockout bracket slots based on actual
 * group-stage and knockout-round results fetched from Firestore.
 *
 * Usage:
 *   const { updates } = useMatchesStore();
 *   const ktm = useMemo(() => computeKnockoutTeams(updates), [updates]);
 *   // Resolve any knockout match (R32 through Final):
 *   const resolved = resolveMatchTeams(match, ktm);
 */

import { GROUP_STAGE_MATCHES } from '@/data/matches';
import { GROUPS } from '@/data/teams';
import type { Match, Team } from '@/types/match';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GroupStanding {
  team: Team;
  pts: number;
  gf: number;
  ga: number;
}

export interface KnockoutTeamMap {
  /** Group slot key → resolved Team. Keys like "W-A", "RU-A", "W-B", etc. */
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
  /**
   * "W:<matchId>" / "L:<matchId>" → winner or loser team.
   * Populated for every finished knockout match whose teams were both resolved.
   */
  matchWinners: Map<string, Team>;
  /**
   * Fully resolved { homeTeam, awayTeam } for every knockout match where
   * both feeders are known (R32 through Final).
   */
  resolvedMatchTeams: Map<string, { homeTeam: Team; awayTeam: Team }>;
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

export type MatchUpdateRecord = Record<
  string,
  { homeScore: number | null; awayScore: number | null; status: string }
>;

export function buildGroupStandings(
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

// ─── R16–Final feeder mapping ─────────────────────────────────────────────────
// "W:<matchId>" = winner of that match, "L:<matchId>" = loser (3rd-place only)

export const KNOCKOUT_FEEDERS: Record<string, [string, string]> = {
  'R16-01': ['W:R32-02', 'W:R32-05'],
  'R16-02': ['W:R32-01', 'W:R32-03'],
  'R16-03': ['W:R32-04', 'W:R32-06'],
  'R16-04': ['W:R32-07', 'W:R32-08'],
  'R16-05': ['W:R32-11', 'W:R32-12'],
  'R16-06': ['W:R32-09', 'W:R32-10'],
  'R16-07': ['W:R32-14', 'W:R32-16'],
  'R16-08': ['W:R32-13', 'W:R32-15'],
  'QF-01':  ['W:R16-01', 'W:R16-02'],
  'QF-02':  ['W:R16-05', 'W:R16-06'],
  'QF-03':  ['W:R16-03', 'W:R16-04'],
  'QF-04':  ['W:R16-07', 'W:R16-08'],
  'SF-01':  ['W:QF-01',  'W:QF-02'],
  'SF-02':  ['W:QF-03',  'W:QF-04'],
  '3RD':    ['L:SF-01',  'L:SF-02'],
  'FINAL':  ['W:SF-01',  'W:SF-02'],
};

const R32_IDS = [
  'R32-01', 'R32-02', 'R32-03', 'R32-04',
  'R32-05', 'R32-06', 'R32-07', 'R32-08',
  'R32-09', 'R32-10', 'R32-11', 'R32-12',
  'R32-13', 'R32-14', 'R32-15', 'R32-16',
] as const;

const CASCADED_ROUNDS = [
  ['R16-01', 'R16-02', 'R16-03', 'R16-04', 'R16-05', 'R16-06', 'R16-07', 'R16-08'],
  ['QF-01', 'QF-02', 'QF-03', 'QF-04'],
  ['SF-01', 'SF-02'],
  ['3RD', 'FINAL'],
] as const;

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Computes the full knockout team map from live Firestore match updates.
 * Cascades R32 team resolution through R16, QF, SF, and Final/3rd-Place.
 *
 * Pass `updates` from `useMatchesStore().updates`.
 */
export function computeKnockoutTeams(updates: MatchUpdateRecord): KnockoutTeamMap {
  // ── Phase 1: group standings ──────────────────────────────────────────────
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

  thirds.sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    const gd = (b.gf - b.ga) - (a.gf - a.ga);
    if (gd !== 0) return gd;
    return b.gf - a.gf;
  });
  const bestThirds = thirds.slice(0, 8).map(t => t.team);
  const allGroupsComplete = completedGroups.size === Object.keys(GROUPS).length;

  const matchWinners = new Map<string, Team>();
  const resolvedMatchTeams = new Map<string, { homeTeam: Team; awayTeam: Team }>();

  // Partial ktm used by resolveR32Teams — new maps start empty but that's fine
  const partialKtm: KnockoutTeamMap = {
    bySlot, bestThirds, completedGroups, allGroupsComplete,
    matchWinners, resolvedMatchTeams,
  };

  // ── Phase 2: resolve R32 teams from group standings ───────────────────────
  for (const matchId of R32_IDS) {
    const { homeTeam, awayTeam } = resolveR32Teams(matchId, partialKtm);
    if (!homeTeam || !awayTeam) continue;

    resolvedMatchTeams.set(matchId, { homeTeam, awayTeam });

    // Determine winner/loser from Firestore if match is finished
    const upd = updates[matchId];
    if (upd?.status === 'finished' && upd.homeScore !== null && upd.awayScore !== null) {
      // homeScore > awayScore → home won (or penalty convention: admin stores penalty score)
      if (upd.homeScore > upd.awayScore) {
        matchWinners.set(`W:${matchId}`, homeTeam);
        matchWinners.set(`L:${matchId}`, awayTeam);
      } else if (upd.awayScore > upd.homeScore) {
        matchWinners.set(`W:${matchId}`, awayTeam);
        matchWinners.set(`L:${matchId}`, homeTeam);
      }
      // Equal (went to penalties stored as separate score): no winner determinable from score alone
    }
  }

  // ── Phase 3: cascade R16 → QF → SF → 3rd/Final ───────────────────────────
  for (const round of CASCADED_ROUNDS) {
    for (const matchId of round) {
      const feeders = KNOCKOUT_FEEDERS[matchId];
      if (!feeders) continue;

      const homeTeam = matchWinners.get(feeders[0]) ?? null;
      const awayTeam = matchWinners.get(feeders[1]) ?? null;
      if (!homeTeam || !awayTeam) continue;

      resolvedMatchTeams.set(matchId, { homeTeam, awayTeam });

      const upd = updates[matchId];
      if (upd?.status === 'finished' && upd.homeScore !== null && upd.awayScore !== null) {
        if (upd.homeScore > upd.awayScore) {
          matchWinners.set(`W:${matchId}`, homeTeam);
          matchWinners.set(`L:${matchId}`, awayTeam);
        } else if (upd.awayScore > upd.homeScore) {
          matchWinners.set(`W:${matchId}`, awayTeam);
          matchWinners.set(`L:${matchId}`, homeTeam);
        }
      }
    }
  }

  return { bySlot, bestThirds, completedGroups, allGroupsComplete, matchWinners, resolvedMatchTeams };
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

/**
 * Resolves the teams for any knockout match (R32 through Final).
 * For R32: uses group standings.
 * For R16+: uses cascade winner resolution.
 * Returns the match unchanged if teams can't yet be determined.
 */
export function resolveMatchTeams(match: Match, ktm: KnockoutTeamMap): Match {
  // Already concrete teams — nothing to do
  if (match.homeTeam.id !== 'tbd' && match.awayTeam.id !== 'tbd') return match;

  if (match.stage === 'round-of-32') {
    const { homeTeam, awayTeam } = resolveR32Teams(match.id, ktm);
    if (homeTeam && awayTeam) return { ...match, homeTeam, awayTeam };
    return match;
  }

  const resolved = ktm.resolvedMatchTeams.get(match.id);
  if (!resolved) return match;
  return { ...match, homeTeam: resolved.homeTeam, awayTeam: resolved.awayTeam };
}
