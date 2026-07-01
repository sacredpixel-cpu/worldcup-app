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

import { GROUP_STAGE_MATCHES, KNOCKOUT_MATCHES } from '@/data/matches';
import { GROUPS } from '@/data/teams';
import type { Match, Team } from '@/types/match';

// Pre-build a lookup of static R32 match teams for fallback resolution.
// R32 matches whose slots include BEST3RD can't be resolved from standings
// alone until all groups finish, but the teams may already be hardcoded in
// the static match data. We use those as a fallback so winner tracking
// works for finished matches even while other groups are still in progress.
const STATIC_R32: Map<string, { homeTeam: Team; awayTeam: Team }> = new Map(
  KNOCKOUT_MATCHES
    .filter(m => m.stage === 'round-of-32' && m.homeTeam.id !== 'tbd' && m.awayTeam.id !== 'tbd')
    .map(m => [m.id, { homeTeam: m.homeTeam, awayTeam: m.awayTeam }]),
);

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
  /** Best 8 third-place teams from COMPLETED groups only (sorted by pts → GD → GF). */
  bestThirds: Team[];
  /** Current 3rd-place team per group letter, including incomplete groups (provisional). */
  thirdsByGroup: Map<string, Team>;
  /** Annex C assignment: BEST3RD match ID → source group letter (e.g. 'R32-07' → 'F'). */
  annexCMapping: Record<string, string>;
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
// "BEST3RD" slots are assigned via FIFA Annex C matrix (not sequential).

export const R32_TEAM_SLOTS: Record<string, [string, string]> = {
  'R32-01': ['RU-A',    'RU-B'],
  'R32-02': ['W-E',     'BEST3RD'],
  'R32-03': ['W-F',     'RU-C'],
  'R32-04': ['W-C',     'RU-F'],
  'R32-05': ['W-I',     'BEST3RD'],
  'R32-06': ['RU-E',    'RU-I'],
  'R32-07': ['W-A',     'BEST3RD'],
  'R32-08': ['W-L',     'BEST3RD'],
  'R32-09': ['W-D',     'BEST3RD'],
  'R32-10': ['W-G',     'BEST3RD'],
  'R32-11': ['RU-K',    'RU-L'],
  'R32-12': ['W-H',     'RU-J'],
  'R32-13': ['W-B',     'BEST3RD'],
  'R32-14': ['W-J',     'RU-H'],
  'R32-15': ['W-K',     'BEST3RD'],
  'R32-16': ['RU-D',    'RU-G'],
};

// ─── Annex C 3rd-place assignment ────────────────────────────────────────────

export const BEST3RD_SLOTS = ['R32-02', 'R32-05', 'R32-07', 'R32-08', 'R32-09', 'R32-10', 'R32-13', 'R32-15'] as const;

// Which group's winner is home for each BEST3RD slot (no-rematch constraint reference)
const BEST3RD_WINNER_GROUP: Record<string, string> = {
  'R32-02': 'E', 'R32-05': 'I', 'R32-07': 'A', 'R32-08': 'L',
  'R32-09': 'D', 'R32-10': 'G', 'R32-13': 'B', 'R32-15': 'K',
};

// Default/primary group assigned to each slot when that group qualifies a 3rd-place team
const BEST3RD_PRIMARY_GROUP: Record<string, string> = {
  'R32-02': 'A', 'R32-05': 'C', 'R32-07': 'F', 'R32-08': 'H',
  'R32-09': 'B', 'R32-10': 'J', 'R32-13': 'I', 'R32-15': 'D',
};

// Known Annex C matrix rows (alphabetical combo string → slot → source group)
const ANNEX_C_MATRIX: Record<string, Record<string, string>> = {
  'ABCDFHJL': {
    'R32-02': 'A', 'R32-05': 'C', 'R32-07': 'F', 'R32-08': 'H',
    'R32-09': 'B', 'R32-10': 'J', 'R32-13': 'L', 'R32-15': 'D',
  },
};

/**
 * Builds an Annex C mapping when the exact combo isn't in the matrix.
 * Tries primary assignments first, then slides to the next available group
 * in alphabetical order, always avoiding own-group rematches.
 */
function buildFallbackAnnexC(comboLetters: string[]): Record<string, string> {
  const comboSet = new Set(comboLetters);
  const unassigned = new Set(comboLetters);
  const result: Record<string, string> = {};

  // Pass 1: assign slots whose primary group is in combo with no own-group conflict
  for (const slot of BEST3RD_SLOTS) {
    const primary = BEST3RD_PRIMARY_GROUP[slot];
    const homeGroup = BEST3RD_WINNER_GROUP[slot];
    if (primary && comboSet.has(primary) && primary !== homeGroup && unassigned.has(primary)) {
      result[slot] = primary;
      unassigned.delete(primary);
    }
  }

  // Pass 2: fill remaining slots from leftover groups (alphabetical), no own-group conflict
  for (const slot of BEST3RD_SLOTS) {
    if (result[slot]) continue;
    const homeGroup = BEST3RD_WINNER_GROUP[slot];
    for (const group of [...unassigned].sort()) {
      if (group !== homeGroup) {
        result[slot] = group;
        unassigned.delete(group);
        break;
      }
    }
  }

  return result;
}

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
  const thirdsByGroup = new Map<string, Team>();
  const completeThirds: Array<{ team: Team; pts: number; gf: number; ga: number }> = [];
  const allCurrentThirds: Array<{ group: string; pts: number; gf: number; ga: number }> = [];

  for (const letter of Object.keys(GROUPS)) {
    const { standings, complete } = buildGroupStandings(letter, updates);

    if (standings[2]) {
      thirdsByGroup.set(letter, standings[2].team);
      allCurrentThirds.push({ group: letter, pts: standings[2].pts, gf: standings[2].gf, ga: standings[2].ga });
    }

    if (!complete) continue;
    completedGroups.add(letter);
    if (standings[0]) bySlot.set(`W-${letter}`,  standings[0].team);
    if (standings[1]) bySlot.set(`RU-${letter}`, standings[1].team);
    if (standings[2]) completeThirds.push(standings[2]);
  }

  const sortByPtsGdGf = (a: { pts: number; gf: number; ga: number }, b: { pts: number; gf: number; ga: number }) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    const gd = (b.gf - b.ga) - (a.gf - a.ga);
    if (gd !== 0) return gd;
    return b.gf - a.gf;
  };

  completeThirds.sort(sortByPtsGdGf);
  allCurrentThirds.sort(sortByPtsGdGf);

  const bestThirds = completeThirds.slice(0, 8).map(t => t.team);
  const allGroupsComplete = completedGroups.size === Object.keys(GROUPS).length;

  // Build Annex C mapping from the current best-8 thirds across all groups
  // (provisional during the group stage; confirmed once all 12 groups are done)
  const top8Groups = allCurrentThirds.slice(0, 8).map(t => t.group).sort();
  const comboKey = top8Groups.join('');
  // Only use the matrix if we have an exact match for this combo.
  // The fallback heuristic mis-assigns groups when primary slots are missing
  // from the combo (e.g. it assigned ECU to R32-05 instead of R32-07).
  // Better to show TBD than wrong teams.
  const annexCMapping: Record<string, string> =
    top8Groups.length === 8
      ? (ANNEX_C_MATRIX[comboKey] ?? {})
      : {};

  const matchWinners = new Map<string, Team>();
  const resolvedMatchTeams = new Map<string, { homeTeam: Team; awayTeam: Team }>();

  // Partial ktm used by resolveR32Teams — new maps start empty but that's fine
  const partialKtm: KnockoutTeamMap = {
    bySlot, bestThirds, thirdsByGroup, annexCMapping,
    completedGroups, allGroupsComplete,
    matchWinners, resolvedMatchTeams,
  };

  // ── Phase 2: resolve R32 teams from group standings ───────────────────────
  for (const matchId of R32_IDS) {
    let { homeTeam, awayTeam } = resolveR32Teams(matchId, partialKtm);

    // Fallback: if slot resolution couldn't determine a team (e.g. BEST3RD slot
    // is unresolvable while groups are in progress), use the static match data.
    // This allows winner tracking for finished matches even before all groups end.
    const staticTeams = STATIC_R32.get(matchId);
    if (staticTeams) {
      if (!homeTeam) homeTeam = staticTeams.homeTeam;
      if (!awayTeam) awayTeam = staticTeams.awayTeam;
    }

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

  return { bySlot, bestThirds, thirdsByGroup, annexCMapping, completedGroups, allGroupsComplete, matchWinners, resolvedMatchTeams };
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
      // Bracket card only shows confirmed team once ALL groups are done
      if (!ktm.allGroupsComplete) return null;
      const sourceGroup = ktm.annexCMapping[matchId];
      if (!sourceGroup) return null;
      return ktm.thirdsByGroup.get(sourceGroup) ?? null;
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
    // Partially resolve: show a confirmed team even if the other slot isn't ready yet
    if (homeTeam || awayTeam) {
      return {
        ...match,
        homeTeam: homeTeam ?? match.homeTeam,
        awayTeam: awayTeam ?? match.awayTeam,
      };
    }
    return match;
  }

  const resolved = ktm.resolvedMatchTeams.get(match.id);
  if (!resolved) return match;
  return { ...match, homeTeam: resolved.homeTeam, awayTeam: resolved.awayTeam };
}
