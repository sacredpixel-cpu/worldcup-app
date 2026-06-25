'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { KNOCKOUT_MATCHES, GROUP_STAGE_MATCHES } from '@/data/matches';
import { getMatchNumber } from '@/lib/utils/matchNumbers';
import { FlagImage } from '@/components/ui/FlagImage';
import { PredictionModal } from '@/components/predictions/PredictionModal';
import { FirstPredictionModal } from '@/components/predictions/FirstPredictionModal';
import { useAuthStore, usePredictionsStore } from '@/store';
import { useMatchesStore } from '@/store/slices/matchesSlice';
import { computeKnockoutTeams, resolveMatchTeams, buildGroupStandings, R32_TEAM_SLOTS, KNOCKOUT_FEEDERS } from '@/lib/utils/knockoutAdvancement';
import type { GroupStanding } from '@/lib/utils/knockoutAdvancement';
import type { Match, Team } from '@/types/match';
import { GROUPS } from '@/data/teams';
import type { Prediction } from '@/types/prediction';

// ─── Group card dimensions (compact) ─────────────────────────────────────────
const CARD_H  = 54;
const CARD_W  = 120;

// ─── Knockout card dimensions (full-style) ────────────────────────────────────
const KO_CARD_W = 160;
const KO_CARD_H = 82;

const COL_GAP  = 28;   // gap between bracket columns
const PAIR_GAP = 10;   // vertical gap between R32 bracket pairs

const GRP_HDR_H        = 22;
const MATCH_WITHIN_GAP = 4;
const GROUP_GAP        = 12;

const GROUP_LETTERS = ['A','B','C','D','E','F','G','H','I','J','K','L'];

// ─── FIFA official game numbers (M73–M104) ───────────────────────────────────
const FIFA_GAME: Record<string, number> = {
  'R32-01': 73,  'R32-02': 74,  'R32-03': 75,  'R32-04': 76,
  'R32-05': 77,  'R32-06': 78,  'R32-07': 79,  'R32-08': 80,
  'R32-09': 81,  'R32-10': 82,  'R32-11': 83,  'R32-12': 84,
  'R32-13': 85,  'R32-14': 86,  'R32-15': 87,  'R32-16': 88,
  'R16-01': 89,  'R16-02': 90,  'R16-03': 91,  'R16-04': 92,
  'R16-05': 93,  'R16-06': 94,  'R16-07': 95,  'R16-08': 96,
  'QF-01':  97,  'QF-02':  98,  'QF-03':  99,  'QF-04': 100,
  'SF-01': 101,  'SF-02': 102,
  '3RD':   103,  'FINAL': 104,
};

// ─── Official bracket display order ──────────────────────────────────────────
// FIFA 2026 uses non-sequential cross-pairings. Reorder matches so that each
// adjacent pair of cards in a column correctly feeds the next round's card above
// them, matching the yCenter() tree geometry.
//
// Pairs (read top-to-bottom within each group of 2):
//   R32: [02,05]→R16-01(M89)  [01,03]→R16-02(M90)
//        [11,12]→R16-05(M93)  [09,10]→R16-06(M94)
//        [04,06]→R16-03(M91)  [07,08]→R16-04(M92)
//        [14,16]→R16-07(M95)  [13,15]→R16-08(M96)
//   R16: [01,02]→QF-01(M97)   [05,06]→QF-02(M98)
//        [03,04]→QF-03(M99)   [07,08]→QF-04(M100)
//   QF:  [01,02]→SF-01(M101)  [03,04]→SF-02(M102)  (natural order is already correct)
const BRACKET_DISPLAY_ORDER: Partial<Record<Match['stage'], string[]>> = {
  'round-of-32': [
    'R32-02', 'R32-05',  // → R16-01 M89
    'R32-01', 'R32-03',  // → R16-02 M90
    'R32-11', 'R32-12',  // → R16-05 M93
    'R32-09', 'R32-10',  // → R16-06 M94
    'R32-04', 'R32-06',  // → R16-03 M91
    'R32-07', 'R32-08',  // → R16-04 M92
    'R32-14', 'R32-16',  // → R16-07 M95
    'R32-13', 'R32-15',  // → R16-08 M96
  ],
  'round-of-16': [
    'R16-01', 'R16-02',  // → QF-01 M97
    'R16-05', 'R16-06',  // → QF-02 M98
    'R16-03', 'R16-04',  // → QF-03 M99
    'R16-07', 'R16-08',  // → QF-04 M100
  ],
};

// ─── Bracket slot labels (using FIFA game numbers for feeder references) ──────
// Official 2026 FIFA World Cup bracket structure
const SLOTS: Record<string, [string, string]> = {
  // Round of 32 — group winners, runners-up and best 3rd-place teams
  'R32-01': ['R/U Group A',  'R/U Group B'],
  'R32-02': ['W Group E',    'Best 3rd'],
  'R32-03': ['W Group F',    'R/U Group C'],
  'R32-04': ['W Group C',    'R/U Group F'],
  'R32-05': ['W Group I',    'Best 3rd'],
  'R32-06': ['R/U Group E',  'R/U Group I'],
  'R32-07': ['W Group A',    'Best 3rd'],
  'R32-08': ['W Group L',    'Best 3rd'],
  'R32-09': ['W Group D',    'Best 3rd'],
  'R32-10': ['W Group G',    'Best 3rd'],
  'R32-11': ['R/U Group K',  'R/U Group L'],
  'R32-12': ['W Group H',    'R/U Group J'],
  'R32-13': ['W Group B',    'Best 3rd'],
  'R32-14': ['W Group J',    'R/U Group H'],
  'R32-15': ['W Group K',    'Best 3rd'],
  'R32-16': ['R/U Group D',  'R/U Group G'],
  // Round of 16 — W M## refers to the FIFA game number of each feeder match
  'R16-01': ['W M74',  'W M77'],
  'R16-02': ['W M73',  'W M75'],
  'R16-03': ['W M76',  'W M78'],
  'R16-04': ['W M79',  'W M80'],
  'R16-05': ['W M83',  'W M84'],
  'R16-06': ['W M81',  'W M82'],
  'R16-07': ['W M86',  'W M88'],
  'R16-08': ['W M85',  'W M87'],
  // Quarter-finals
  'QF-01':  ['W M89',  'W M90'],
  'QF-02':  ['W M93',  'W M94'],
  'QF-03':  ['W M91',  'W M92'],
  'QF-04':  ['W M95',  'W M96'],
  // Semi-finals
  'SF-01':  ['W M97',  'W M98'],
  'SF-02':  ['W M99',  'W M100'],
  '3RD':    ['L M101', 'L M102'],
  'FINAL':  ['W M101', 'W M102'],
};

// ─── Knockout bracket position helper ────────────────────────────────────────
function yCenter(round: number, idx: number): number {
  if (round === 0) return idx * KO_CARD_H + Math.floor(idx / 2) * PAIR_GAP + KO_CARD_H / 2;
  return (yCenter(round - 1, idx * 2) + yCenter(round - 1, idx * 2 + 1)) / 2;
}

const BRACKET_ROUNDS: { stage: Match['stage']; label: string; count: number }[] = [
  { stage: 'round-of-32',   label: 'Round of 32', count: 16 },
  { stage: 'round-of-16',   label: 'Round of 16', count: 8  },
  { stage: 'quarter-final', label: 'Quarters',    count: 4  },
  { stage: 'semi-final',    label: 'Semis',       count: 2  },
  { stage: 'final',         label: 'Final',       count: 1  },
];

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
}

// ─── Accordion team candidates ────────────────────────────────────────────────

interface TeamCandidate {
  team: Team;
  confidence: 'likely' | 'possible';
}
interface CardCandidates {
  home: TeamCandidate[];
  away: TeamCandidate[];
}

function slotKeyCandidates(
  key: string,
  groupStandingsMap: Map<string, { standings: GroupStanding[]; complete: boolean }>,
): TeamCandidate[] {
  if (key === 'BEST3RD') {
    const thirds: Array<{ team: Team; pts: number; gd: number; gf: number }> = [];
    for (const { standings } of groupStandingsMap.values()) {
      if (standings[2]) {
        const s = standings[2];
        thirds.push({ team: s.team, pts: s.pts, gd: s.gf - s.ga, gf: s.gf });
      }
    }
    thirds.sort((a, b) => b.pts !== a.pts ? b.pts - a.pts : b.gd !== a.gd ? b.gd - a.gd : b.gf - a.gf);
    const hasActivity = thirds.some(t => t.pts > 0 || t.gf > 0);
    return thirds.slice(0, 4).map((t, i) => ({
      team: t.team,
      confidence: (hasActivity && i === 0) ? 'likely' : 'possible',
    }));
  }

  const dashIdx   = key.indexOf('-');
  const posStr    = key.slice(0, dashIdx);
  const letter    = key.slice(dashIdx + 1);
  const targetPos = posStr === 'W' ? 0 : 1;

  const result = groupStandingsMap.get(letter);
  if (!result) return [];
  const { standings, complete } = result;
  if (standings.length === 0) return [];

  if (complete) return [{ team: standings[targetPos].team, confidence: 'likely' }];

  const hasActivity = standings.some(s => s.pts > 0 || s.gf > 0 || s.ga > 0);
  if (!hasActivity) return standings.map(s => ({ team: s.team, confidence: 'possible' as const }));

  return standings.map((s, i) => ({
    team: s.team,
    confidence: i === targetPos ? 'likely' : 'possible',
  }));
}

function computeR32Candidates(
  matchId: string,
  groupStandingsMap: Map<string, { standings: GroupStanding[]; complete: boolean }>,
): CardCandidates | null {
  const slots = R32_TEAM_SLOTS[matchId];
  if (!slots) return null;
  return {
    home: slotKeyCandidates(slots[0], groupStandingsMap),
    away: slotKeyCandidates(slots[1], groupStandingsMap),
  };
}

function computeR16Candidates(
  matchId: string,
  ktm: ReturnType<typeof computeKnockoutTeams>,
): CardCandidates | null {
  const feeders = KNOCKOUT_FEEDERS[matchId];
  if (!feeders) return null;

  const getFeederCandidates = (feeder: string): TeamCandidate[] => {
    const r32Id = feeder.slice(2);
    const winner = ktm.matchWinners.get(feeder);
    if (winner) {
      const loser = ktm.matchWinners.get(`L:${r32Id}`);
      const result: TeamCandidate[] = [{ team: winner, confidence: 'likely' }];
      if (loser) result.push({ team: loser, confidence: 'possible' });
      return result;
    }
    const r32Teams = ktm.resolvedMatchTeams.get(r32Id);
    if (r32Teams) {
      return [
        { team: r32Teams.homeTeam, confidence: 'possible' },
        { team: r32Teams.awayTeam, confidence: 'possible' },
      ];
    }
    return [];
  };

  return {
    home: getFeederCandidates(feeders[0]),
    away: getFeederCandidates(feeders[1]),
  };
}

// ─── Group match card (compact, vertical) ────────────────────────────────────
function MatchCardInner({
  match,
  hasPrediction,
  gameNumber,
  onClick,
}: {
  match: Match;
  hasPrediction?: boolean;
  gameNumber?: number;
  onClick?: () => void;
}) {
  const isTbd      = match.homeTeam.id === 'tbd';
  const isFinished = match.status === 'finished' && match.homeScore !== null;
  const isLive     = match.status === 'live';
  const winnerSide: 'home' | 'away' | null = isFinished
    ? match.homeScore! > match.awayScore! ? 'home'
    : match.homeScore! < match.awayScore! ? 'away'
    : null : null;

  const borderColor = isLive
    ? 'rgba(255,31,142,0.45)'
    : hasPrediction
    ? 'rgba(255,31,142,0.28)'
    : 'rgba(255,255,255,0.09)';

  return (
    <div
      onClick={onClick}
      style={{
        width: CARD_W, height: CARD_H,
        background: '#0C1430',
        border: `1px solid ${borderColor}`,
        borderRadius: 7, overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        cursor: onClick ? 'pointer' : 'default',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {(['home', 'away'] as const).map((side, i) => {
        const team  = side === 'home' ? match.homeTeam : match.awayTeam;
        const score = side === 'home' ? match.homeScore : match.awayScore;
        const isWin  = winnerSide === side;
        const isLoss = winnerSide !== null && !isWin;
        return (
          <div key={side} style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '0 7px', flex: '0 0 19px',
            borderBottom: i === 0 ? '1px solid rgba(255,255,255,0.06)' : undefined,
            background: isWin ? 'rgba(255,31,142,0.08)' : undefined,
          }}>
            {!isTbd && <FlagImage code={team.code} size={14} />}
            <span style={{
              flex: 1, fontSize: isTbd ? 9 : 10, fontWeight: isWin ? 700 : 500,
              color: isTbd ? '#6A82A8' : isLoss ? '#6A82A8' : '#C8D8F0',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1,
            }}>
              {isTbd ? 'TBD' : team.code}
            </span>
            {(isFinished || isLive) && score !== null && (
              <span style={{ fontSize: 11, fontWeight: 800, color: isWin ? '#FF4DA8' : '#8AA0C4', fontFamily: 'var(--font-barlow-condensed)', minWidth: 10, textAlign: 'right' }}>
                {score}
              </span>
            )}
          </div>
        );
      })}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 7px', borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.18)', overflow: 'hidden' }}>
        <span style={{ fontSize: 8, color: '#6A82A8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1 }}>
          {fmtDate(match.kickoffAt)} · {match.city.split(',')[0]}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0, marginLeft: 3 }}>
          {gameNumber != null && (
            <span style={{ fontSize: 8, fontWeight: 700, color: '#FFB020', letterSpacing: '0.03em', lineHeight: 1 }}>
              M{gameNumber}
            </span>
          )}
          {hasPrediction && (
            <span style={{ fontSize: 9, color: '#FF4DA8', lineHeight: 1 }}>✓</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Knockout match card (full-style, horizontal) ────────────────────────────
function KnockoutCardInner({
  match,
  prediction,
  slotLabels,
  gameNumber,
  onClick,
  candidates,
}: {
  match: Match;
  prediction?: Prediction;
  slotLabels?: [string, string];
  gameNumber?: number;
  onClick?: () => void;
  candidates?: CardCandidates;
}) {
  const [expanded, setExpanded] = useState(false);
  const isHomeTbd  = match.homeTeam.id === 'tbd';
  const isAwayTbd  = match.awayTeam.id === 'tbd';
  const isTbd      = isHomeTbd && isAwayTbd;
  const isFinished = match.status === 'finished' && match.homeScore !== null;
  const isLive     = match.status === 'live';
  const hasScore   = match.homeScore !== null;
  const hasPrediction = !!prediction;
  const isLocked   = new Date(match.kickoffAt) <= new Date() || match.status !== 'upcoming';

  const winnerSide: 'home' | 'away' | null = isFinished
    ? match.homeScore! > match.awayScore! ? 'home'
    : match.homeScore! < match.awayScore! ? 'away'
    : null : null;

  const borderColor = isLive
    ? 'rgba(255,176,32,0.25)'
    : hasPrediction
    ? 'rgba(255,31,142,0.25)'
    : 'rgba(255,255,255,0.07)';

  const TEAM_W = 46;
  const VS_W   = KO_CARD_W - TEAM_W * 2 - 12 - 8;

  return (
    <div style={{ width: KO_CARD_W, position: 'relative' }}>
      <div
        onClick={onClick}
        style={{
          width: KO_CARD_W, height: KO_CARD_H,
          background: 'linear-gradient(160deg, #0E1535 0%, #0A1128 100%)',
          border: `1px solid ${borderColor}`,
          borderRadius: 10, overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
          cursor: onClick ? 'pointer' : 'default',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        {/* Teams + VS/Score */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '0 6px', gap: 4 }}>

          {/* Home team */}
          <div style={{ width: TEAM_W, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <div style={{
              width: 26, height: 26, borderRadius: '50%',
              background: 'rgba(255,255,255,0.04)', border: '1.5px solid rgba(255,255,255,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              {isHomeTbd
                ? <span style={{ fontSize: 6, fontWeight: 700, color: '#7A91BB' }}>TBD</span>
                : <FlagImage code={match.homeTeam.code} size={17} />
              }
            </div>
            <span style={{
              fontSize: 8, fontWeight: 800, lineHeight: 1, textAlign: 'center',
              fontFamily: 'var(--font-barlow-condensed)', letterSpacing: '0.03em',
              color: winnerSide === 'away' ? '#4A6090' : '#E8F0FF',
              width: TEAM_W, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {isHomeTbd ? (slotLabels?.[0] ?? 'TBD') : match.homeTeam.code}
            </span>
            <span style={{ fontSize: 7, fontWeight: 600, color: '#00C44F', lineHeight: 1 }}>Home</span>
          </div>

          {/* VS / Score center box */}
          <div style={{
            flex: 1, minWidth: VS_W,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 7, padding: '4px 3px', gap: 2, alignSelf: 'center',
            height: KO_CARD_H - 22,
          }}>
            {hasScore ? (
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
                <span style={{ fontFamily: 'var(--font-barlow-condensed)', fontSize: 22, fontWeight: 900, color: '#E8F0FF', lineHeight: 1 }}>
                  {match.homeScore}
                </span>
                <span style={{ fontFamily: 'var(--font-barlow-condensed)', fontSize: 13, fontWeight: 700, color: '#3A4E6E', lineHeight: 1 }}>:</span>
                <span style={{ fontFamily: 'var(--font-barlow-condensed)', fontSize: 22, fontWeight: 900, color: '#E8F0FF', lineHeight: 1 }}>
                  {match.awayScore}
                </span>
              </div>
            ) : hasPrediction && !isLocked ? (
              <>
                <span style={{ fontSize: 7, fontWeight: 700, color: '#FF1F8E', textTransform: 'uppercase', letterSpacing: '0.1em', lineHeight: 1 }}>Predicted</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 2, background: 'rgba(255,31,142,0.1)', border: '1px solid rgba(255,31,142,0.2)', borderRadius: 10, padding: '2px 5px' }}>
                  <svg viewBox="0 0 24 24" fill="#FF1F8E" style={{ width: 7, height: 7, flexShrink: 0 }}>
                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                  </svg>
                  <span style={{ fontFamily: 'var(--font-barlow-condensed)', fontSize: 13, fontWeight: 900, color: '#FF1F8E', lineHeight: 1 }}>
                    {prediction!.homeScore}–{prediction!.awayScore}
                  </span>
                </div>
              </>
            ) : (
              <span style={{ fontFamily: 'var(--font-barlow-condensed)', fontSize: 14, fontWeight: 900, color: '#3A4E6E', letterSpacing: '0.15em', lineHeight: 1 }}>VS</span>
            )}
            {isLive && (
              <span style={{ fontSize: 7, fontWeight: 700, color: '#FFB020', letterSpacing: '0.08em', lineHeight: 1 }}>LIVE</span>
            )}
            {isFinished && !hasScore && (
              <span style={{ fontSize: 7, fontWeight: 700, color: '#7A91BB', lineHeight: 1 }}>FT</span>
            )}
          </div>

          {/* Away team */}
          <div style={{ width: TEAM_W, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <div style={{
              width: 26, height: 26, borderRadius: '50%',
              background: 'rgba(255,255,255,0.04)', border: '1.5px solid rgba(255,255,255,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              {isAwayTbd
                ? <span style={{ fontSize: 6, fontWeight: 700, color: '#7A91BB' }}>TBD</span>
                : <FlagImage code={match.awayTeam.code} size={17} />
              }
            </div>
            <span style={{
              fontSize: 8, fontWeight: 800, lineHeight: 1, textAlign: 'center',
              fontFamily: 'var(--font-barlow-condensed)', letterSpacing: '0.03em',
              color: winnerSide === 'home' ? '#4A6090' : '#E8F0FF',
              width: TEAM_W, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {isAwayTbd ? (slotLabels?.[1] ?? 'TBD') : match.awayTeam.code}
            </span>
            <span style={{ fontSize: 7, fontWeight: 600, color: '#FF1F8E', lineHeight: 1 }}>Away</span>
          </div>

        </div>

        {/* Footer */}
        <div style={{
          height: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'rgba(0,0,0,0.2)', borderTop: '1px solid rgba(255,255,255,0.05)',
          padding: '0 6px', overflow: 'hidden',
        }}>
          <span style={{ fontSize: 7, color: '#5A6E94', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1 }}>
            <span style={{ color: '#7A91BB' }}>{fmtDate(match.kickoffAt)}</span>
            {' · '}{match.city.split(',')[0]}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0, marginLeft: 3 }}>
            {gameNumber && (
              <span style={{ fontSize: 7, fontWeight: 700, color: '#FFB020', letterSpacing: '0.04em', lineHeight: 1 }}>
                M{gameNumber}
              </span>
            )}
            {candidates && (
              <button
                onClick={(e) => { e.stopPropagation(); setExpanded(x => !x); }}
                style={{ background: 'none', border: 'none', padding: '0 1px', cursor: 'pointer', color: expanded ? '#FF4DA8' : '#5A6E94', fontSize: 8, lineHeight: 1, display: 'flex', alignItems: 'center' }}
              >
                {expanded ? '▲' : '▼'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Accordion panel — absolutely positioned below the card */}
      {candidates && expanded && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'absolute', top: KO_CARD_H - 1, left: 0, width: KO_CARD_W,
            background: '#070C1B',
            border: '1px solid rgba(255,255,255,0.09)',
            borderTop: '1px solid rgba(255,255,255,0.04)',
            borderRadius: '0 0 10px 10px',
            padding: '5px 5px 4px',
            zIndex: 50,
          }}
        >
          <div style={{ display: 'flex', gap: 4 }}>
            {/* Home column */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 6, fontWeight: 700, color: '#3A4E6E', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {slotLabels?.[0] ?? 'Home'}
              </div>
              {candidates.home.length === 0
                ? <span style={{ fontSize: 7, color: '#3A4E6E' }}>TBD</span>
                : candidates.home.slice(0, 4).map((c) => (
                  <div key={c.team.id} style={{ display: 'flex', alignItems: 'center', gap: 3, marginBottom: 2 }}>
                    <FlagImage code={c.team.code} size={9} />
                    <span style={{ flex: 1, fontSize: 8, fontWeight: 700, lineHeight: 1, color: c.confidence === 'likely' ? '#C8D8F0' : '#4A5E7A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.team.code}
                    </span>
                    <span style={{ fontSize: 7, color: c.confidence === 'likely' ? '#FF4DA8' : '#2E3F5A', lineHeight: 1, flexShrink: 0 }}>
                      {c.confidence === 'likely' ? '★' : '·'}
                    </span>
                  </div>
                ))
              }
            </div>

            {/* Divider */}
            <div style={{ width: 1, background: 'rgba(255,255,255,0.07)', flexShrink: 0, alignSelf: 'stretch' }} />

            {/* Away column */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 6, fontWeight: 700, color: '#3A4E6E', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {slotLabels?.[1] ?? 'Away'}
              </div>
              {candidates.away.length === 0
                ? <span style={{ fontSize: 7, color: '#3A4E6E' }}>TBD</span>
                : candidates.away.slice(0, 4).map((c) => (
                  <div key={c.team.id} style={{ display: 'flex', alignItems: 'center', gap: 3, marginBottom: 2 }}>
                    <FlagImage code={c.team.code} size={9} />
                    <span style={{ flex: 1, fontSize: 8, fontWeight: 700, lineHeight: 1, color: c.confidence === 'likely' ? '#C8D8F0' : '#4A5E7A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.team.code}
                    </span>
                    <span style={{ fontSize: 7, color: c.confidence === 'likely' ? '#FF4DA8' : '#2E3F5A', lineHeight: 1, flexShrink: 0 }}>
                      {c.confidence === 'likely' ? '★' : '·'}
                    </span>
                  </div>
                ))
              }
            </div>
          </div>
          {/* Legend */}
          <div style={{ marginTop: 4, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <span style={{ fontSize: 6, color: '#FF4DA8' }}>★ Most Likely</span>
            <span style={{ fontSize: 6, color: '#3A4E6E' }}>· Possible</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export function BracketView() {
  const { user } = useAuthStore();
  const { saved } = usePredictionsStore();
  const { updates, getLiveMatch } = useMatchesStore();
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [showFirstPrediction, setShowFirstPrediction] = useState(false);

  // ── Pinch-to-zoom ────────────────────────────────────────────────────────
  const [scale, setScale] = useState(1);
  const scaleRef = useRef(1);          // mirror for use inside event closures
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    // Explicit non-null cast so TypeScript retains the type inside closures
    const container: HTMLDivElement = el;

    let startDist  = 0;
    let startScale = 1;
    let startSL    = 0; // scrollLeft at pinch start
    let startST    = 0; // scrollTop at pinch start
    let midX       = 0; // pinch midpoint X relative to container left edge
    let midY       = 0; // pinch midpoint Y relative to container top edge
    let isPinching = false;
    let lastTouchEnd = 0;

    function dist(e: TouchEvent) {
      return Math.hypot(
        e.touches[1].clientX - e.touches[0].clientX,
        e.touches[1].clientY - e.touches[0].clientY,
      );
    }

    function onStart(e: TouchEvent) {
      if (e.touches.length === 2) {
        e.preventDefault();
        isPinching = true;
        startDist  = dist(e);
        startScale = scaleRef.current;
        startSL    = container.scrollLeft;
        startST    = container.scrollTop;
        const rect = container.getBoundingClientRect();
        midX = (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left;
        midY = (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top;
      }
    }

    function onMove(e: TouchEvent) {
      if (!isPinching || e.touches.length !== 2) return;
      e.preventDefault();
      const newScale = Math.min(Math.max(startScale * (dist(e) / startDist), 0.5), 3.5);
      const ratio    = newScale / startScale;
      // Scroll so the content point under the pinch midpoint stays fixed on screen:
      //   newScrollLeft = (startSL + midX) * ratio - midX
      container.scrollLeft  = (startSL + midX) * ratio - midX;
      container.scrollTop   = (startST + midY) * ratio - midY;
      scaleRef.current      = newScale;
      setScale(newScale);
    }

    function onEnd(e: TouchEvent) {
      if (e.touches.length < 2) isPinching = false;
      // Double-tap (single finger, no fingers remaining) resets zoom
      if (e.changedTouches.length === 1 && e.touches.length === 0) {
        const now = Date.now();
        if (now - lastTouchEnd < 300) {
          scaleRef.current   = 1;
          setScale(1);
          container.scrollLeft = 0;
          container.scrollTop  = 0;
        }
        lastTouchEnd = now;
      }
    }

    container.addEventListener('touchstart', onStart, { passive: false });
    container.addEventListener('touchmove',  onMove,  { passive: false });
    container.addEventListener('touchend',   onEnd);
    return () => {
      container.removeEventListener('touchstart', onStart);
      container.removeEventListener('touchmove',  onMove);
      container.removeEventListener('touchend',   onEnd);
    };
  }, []);

  function resetZoom() {
    scaleRef.current = 1;
    setScale(1);
    if (containerRef.current) {
      containerRef.current.scrollLeft = 0;
      containerRef.current.scrollTop  = 0;
    }
  }

  // Compute which teams advance to knockout rounds based on group results
  const ktm = useMemo(() => computeKnockoutTeams(updates), [updates]);

  // Compute per-group standings for the accordion candidates
  const groupStandingsMap = useMemo(() => {
    const map = new Map<string, { standings: GroupStanding[]; complete: boolean }>();
    for (const letter of Object.keys(GROUPS)) {
      map.set(letter, buildGroupStandings(letter, updates));
    }
    return map;
  }, [updates]);

  const handleMatchTap = (match: Match) => {
    if (!user || match.homeTeam.id === 'tbd') return;
    setSelectedMatch(match);
  };

  // Group stage data (with live scores merged in)
  const groupMatchData: Record<string, Match[]> = {};
  for (const letter of GROUP_LETTERS) {
    groupMatchData[letter] = GROUP_STAGE_MATCHES
      .filter(m => m.homeTeam.group === letter)
      .sort((a, b) => a.kickoffAt.localeCompare(b.kickoffAt))
      .map(m => getLiveMatch(m));
  }

  // Knockout stage data — merge live scores and cascade-resolve teams through all rounds
  const resolvedKnockoutMatches: Match[] = useMemo(() => {
    return KNOCKOUT_MATCHES.map(match => {
      const live = getLiveMatch(match);
      return resolveMatchTeams(live, ktm);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updates, ktm]);

  const matchesByStage: Partial<Record<Match['stage'], Match[]>> = {};
  for (const r of BRACKET_ROUNDS) {
    const raw   = resolvedKnockoutMatches.filter(m => m.stage === r.stage);
    const order = BRACKET_DISPLAY_ORDER[r.stage];
    matchesByStage[r.stage] = order
      ? order.map(id => raw.find(m => m.id === id)).filter((m): m is Match => !!m)
      : raw;
  }
  const thirdPlace = resolvedKnockoutMatches.find(m => m.stage === 'third-place');

  const KO_W = BRACKET_ROUNDS.length * KO_CARD_W + (BRACKET_ROUNDS.length - 1) * COL_GAP;
  const KO_H = 15 * KO_CARD_H + 7 * PAIR_GAP + KO_CARD_H;

  // SVG connector paths
  const paths: { d: string; key: string }[] = [];
  for (let r = 0; r < BRACKET_ROUNDS.length - 1; r++) {
    const x1   = r * (KO_CARD_W + COL_GAP) + KO_CARD_W;
    const x2   = (r + 1) * (KO_CARD_W + COL_GAP);
    const xMid = (x1 + x2) / 2;
    for (let i = 0; i < BRACKET_ROUNDS[r + 1].count; i++) {
      const topC  = yCenter(r, i * 2);
      const botC  = yCenter(r, i * 2 + 1);
      const nextC = yCenter(r + 1, i);
      paths.push({ d: `M${x1} ${topC} H${xMid} V${nextC} H${x2}`, key: `t-${r}-${i}` });
      paths.push({ d: `M${x1} ${botC} H${xMid} V${nextC}`,        key: `b-${r}-${i}` });
    }
  }

  // Natural content dimensions — used to size the scroll-area spacer at each scale level.
  // These are derived from the same layout constants used to render the bracket below,
  // so the spacer always matches the actual rendered content.
  const GROUP_COL_H_TOTAL = 12 * (GRP_HDR_H + 6 * CARD_H + 5 * MATCH_WITHIN_GAP) + 11 * GROUP_GAP;
  const NATURAL_CONTENT_W = 16 + CARD_W + COL_GAP + KO_W + 16;
  // 32 = column-header row + marginBottom; 4 = paddingBottom; 130 = 3rd-place section + extra
  const NATURAL_CONTENT_H = 32 + Math.max(GROUP_COL_H_TOTAL, KO_H) + 4 + (thirdPlace ? 130 : 0) + 20;

  const scalePct = Math.round(scale * 100);

  return (
    <div>

      {/* Controls: zoom hint + reset button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px 8px' }}>
        <span style={{ fontSize: 10, color: '#5A6E94' }}>Pinch to zoom · double-tap to reset</span>
        {scalePct !== 100 && (
          <button
            onClick={resetZoom}
            style={{
              background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 20, padding: '3px 10px', fontSize: 10, fontWeight: 700,
              color: '#E8F0FF', cursor: 'pointer',
            }}
          >
            {scalePct}% · Reset
          </button>
        )}
      </div>

      {/* ── Scrollable zoom viewport ──────────────────────────────────────────
          overflow: auto handles both X and Y panning.
          A spacer div expands the scroll area to match the scaled content size.
          The actual content is position:absolute so transform:scale doesn't
          affect layout (and therefore doesn't fight the spacer). */}
      <div
        ref={containerRef}
        style={{
          overflow: 'auto',
          position: 'relative',
          height: 'calc(100svh - 220px)',
          minHeight: 420,
        }}
      >
        {/* Spacer: sets the scrollable area to NATURAL_CONTENT × scale */}
        <div
          aria-hidden="true"
          style={{ width: NATURAL_CONTENT_W * scale, height: NATURAL_CONTENT_H * scale, pointerEvents: 'none' }}
        />

        {/* Scaled content — anchored top-left, scaled outward */}
        <div
          style={{
            position: 'absolute', top: 0, left: 0,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
        >

      <div style={{ paddingLeft: 16, paddingRight: 16, paddingBottom: 4 }}>

        {/* Column headers */}
        <div style={{ display: 'flex', gap: COL_GAP, marginBottom: 8 }}>
          <div style={{ width: CARD_W, flexShrink: 0, textAlign: 'center' }}>
            <span style={{ fontSize: 9, fontWeight: 700, color: '#8AA0C4', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Group Stage</span>
          </div>
          {BRACKET_ROUNDS.map(r => (
            <div key={r.stage} style={{ width: KO_CARD_W, flexShrink: 0, textAlign: 'center' }}>
              <span style={{ fontSize: 9, fontWeight: 700, color: '#8AA0C4', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{r.label}</span>
            </div>
          ))}
        </div>

        {/* Main bracket row */}
        <div style={{ display: 'flex', gap: COL_GAP, alignItems: 'flex-start' }}>

          {/* Group stage column */}
          <div style={{ flexShrink: 0, width: CARD_W }}>
            {GROUP_LETTERS.map((letter, gi) => (
              <div key={letter} style={{ marginBottom: gi < 11 ? GROUP_GAP : 0 }}>
                <div style={{
                  height: GRP_HDR_H, display: 'flex', alignItems: 'center', padding: '0 8px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderBottom: 'none',
                  borderRadius: '7px 7px 0 0',
                }}>
                  <span style={{ fontSize: 9, fontWeight: 700, color: '#C8D8F0', letterSpacing: '0.06em' }}>GROUP {letter}</span>
                </div>
                {groupMatchData[letter].map((match, j) => (
                  <div key={match.id} style={{ marginBottom: j < 5 ? MATCH_WITHIN_GAP : 0 }}>
                    <MatchCardInner
                      match={match}
                      hasPrediction={!!saved[match.id]}
                      gameNumber={getMatchNumber(match.id) ?? undefined}
                      onClick={() => handleMatchTap(match)}
                    />
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Knockout bracket canvas */}
          <div style={{ position: 'relative', width: KO_W, height: KO_H, flexShrink: 0 }}>
            <svg style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'visible' }} width={KO_W} height={KO_H}>
              {paths.map(({ d, key }) => (
                <path key={key} d={d} fill="none" stroke="rgba(90,110,148,0.3)" strokeWidth={1} strokeLinecap="round" strokeLinejoin="round" />
              ))}
            </svg>

            {BRACKET_ROUNDS.map((round, r) =>
              (matchesByStage[round.stage] ?? []).map((match, i) => {
                const candidates = round.stage === 'round-of-32'
                  ? computeR32Candidates(match.id, groupStandingsMap) ?? undefined
                  : round.stage === 'round-of-16'
                  ? computeR16Candidates(match.id, ktm) ?? undefined
                  : undefined;
                return (
                  <div key={match.id} style={{
                    position: 'absolute',
                    left: r * (KO_CARD_W + COL_GAP),
                    top: yCenter(r, i) - KO_CARD_H / 2,
                  }}>
                    <KnockoutCardInner
                      match={match}
                      slotLabels={SLOTS[match.id]}
                      prediction={saved[match.id]}
                      gameNumber={FIFA_GAME[match.id]}
                      onClick={() => handleMatchTap(match)}
                      candidates={candidates}
                    />
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Third-place */}
      {thirdPlace && (
        <div style={{ padding: '16px 16px 0' }}>
          <span style={{ fontSize: 9, fontWeight: 700, color: '#8AA0C4', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>
            3rd Place
          </span>
          <KnockoutCardInner
            match={thirdPlace}
            slotLabels={SLOTS['3RD']}
            prediction={saved[thirdPlace.id]}
            gameNumber={FIFA_GAME['3RD']}
            onClick={() => handleMatchTap(thirdPlace)}
          />
        </div>
      )}

        </div>{/* end scaled content */}
      </div>{/* end scrollable zoom viewport */}

      {/* Prediction modal — outside the scroll container so it renders at full size */}
      {selectedMatch && user && (
        <PredictionModal
          match={selectedMatch}
          userId={user.id}
          existing={saved[selectedMatch.id]}
          open={true}
          onClose={() => setSelectedMatch(null)}
          onFirstEverPrediction={() => setShowFirstPrediction(true)}
        />
      )}
      <FirstPredictionModal
        open={showFirstPrediction}
        onClose={() => setShowFirstPrediction(false)}
      />
    </div>
  );
}
