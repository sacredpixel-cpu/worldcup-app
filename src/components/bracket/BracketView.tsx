'use client';

import { useState } from 'react';
import { KNOCKOUT_MATCHES, GROUP_STAGE_MATCHES } from '@/data/matches';
import { FlagImage } from '@/components/ui/FlagImage';
import { PredictionModal } from '@/components/predictions/PredictionModal';
import { useAuthStore, usePredictionsStore } from '@/store';
import type { Match } from '@/types/match';
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

// ─── Bracket slot labels ──────────────────────────────────────────────────────
const SLOTS: Record<string, [string, string]> = {
  'R32-01': ['W Group A',   'Best 3rd'],
  'R32-02': ['W Group C',   'R/U Group A'],
  'R32-03': ['W Group B',   'Best 3rd'],
  'R32-04': ['W Group D',   'R/U Group B'],
  'R32-05': ['W Group E',   'Best 3rd'],
  'R32-06': ['W Group G',   'R/U Group C'],
  'R32-07': ['W Group F',   'Best 3rd'],
  'R32-08': ['W Group H',   'R/U Group D'],
  'R32-09': ['W Group I',   'R/U Group E'],
  'R32-10': ['W Group J',   'R/U Group F'],
  'R32-11': ['W Group K',   'R/U Group G'],
  'R32-12': ['W Group L',   'R/U Group H'],
  'R32-13': ['R/U Group I', 'Best 3rd'],
  'R32-14': ['R/U Group J', 'Best 3rd'],
  'R32-15': ['R/U Group K', 'Best 3rd'],
  'R32-16': ['R/U Group L', 'Best 3rd'],
  'R16-01': ['W Match 1',   'W Match 2'],
  'R16-02': ['W Match 3',   'W Match 4'],
  'R16-03': ['W Match 5',   'W Match 6'],
  'R16-04': ['W Match 7',   'W Match 8'],
  'R16-05': ['W Match 9',   'W Match 10'],
  'R16-06': ['W Match 11',  'W Match 12'],
  'R16-07': ['W Match 13',  'W Match 14'],
  'R16-08': ['W Match 15',  'W Match 16'],
  'QF-01':  ['W R16 #1',    'W R16 #2'],
  'QF-02':  ['W R16 #3',    'W R16 #4'],
  'QF-03':  ['W R16 #5',    'W R16 #6'],
  'QF-04':  ['W R16 #7',    'W R16 #8'],
  'SF-01':  ['W QF #1',     'W QF #2'],
  'SF-02':  ['W QF #3',     'W QF #4'],
  '3RD':    ['L SF #1',     'L SF #2'],
  'FINAL':  ['W SF #1',     'W SF #2'],
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

// ─── Group match card (compact, vertical) ────────────────────────────────────
function MatchCardInner({
  match,
  hasPrediction,
  onClick,
}: {
  match: Match;
  hasPrediction?: boolean;
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
        {hasPrediction && (
          <span style={{ fontSize: 9, color: '#FF4DA8', marginLeft: 4, flexShrink: 0, lineHeight: 1 }}>✓</span>
        )}
      </div>
    </div>
  );
}

// ─── Knockout match card (full-style, horizontal) ────────────────────────────
function KnockoutCardInner({
  match,
  prediction,
  slotLabels,
  onClick,
}: {
  match: Match;
  prediction?: Prediction;
  slotLabels?: [string, string];
  onClick?: () => void;
}) {
  const isTbd      = match.homeTeam.id === 'tbd';
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
  const VS_W   = KO_CARD_W - TEAM_W * 2 - 12 - 8; // 12px side padding, 8px gaps

  return (
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
            {isTbd
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
            {isTbd ? (slotLabels?.[0] ?? 'TBD') : match.homeTeam.code}
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
            {isTbd
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
            {isTbd ? (slotLabels?.[1] ?? 'TBD') : match.awayTeam.code}
          </span>
          <span style={{ fontSize: 7, fontWeight: 600, color: '#FF1F8E', lineHeight: 1 }}>Away</span>
        </div>

      </div>

      {/* Footer */}
      <div style={{
        height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.2)', borderTop: '1px solid rgba(255,255,255,0.05)',
        padding: '0 6px', overflow: 'hidden',
      }}>
        <span style={{ fontSize: 7, color: '#5A6E94', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1 }}>
          <span style={{ color: '#7A91BB' }}>{fmtDate(match.kickoffAt)}</span>
          {' · '}{match.city.split(',')[0]}
        </span>
      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export function BracketView() {
  const { user } = useAuthStore();
  const { saved } = usePredictionsStore();
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

  const handleMatchTap = (match: Match) => {
    if (!user || match.homeTeam.id === 'tbd') return;
    setSelectedMatch(match);
  };

  // Group stage data
  const groupMatchData: Record<string, Match[]> = {};
  for (const letter of GROUP_LETTERS) {
    groupMatchData[letter] = GROUP_STAGE_MATCHES
      .filter(m => m.homeTeam.group === letter)
      .sort((a, b) => a.kickoffAt.localeCompare(b.kickoffAt));
  }

  // Knockout stage data
  const matchesByStage: Partial<Record<Match['stage'], Match[]>> = {};
  for (const r of BRACKET_ROUNDS) {
    matchesByStage[r.stage] = KNOCKOUT_MATCHES.filter(m => m.stage === r.stage);
  }
  const thirdPlace = KNOCKOUT_MATCHES.find(m => m.stage === 'third-place');

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

  return (
    <div style={{ paddingBottom: 24 }}>
      <div style={{ overflowX: 'auto', paddingLeft: 16, paddingRight: 16, paddingBottom: 4 }}>

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
              (matchesByStage[round.stage] ?? []).map((match, i) => (
                <div key={match.id} style={{
                  position: 'absolute',
                  left: r * (KO_CARD_W + COL_GAP),
                  top: yCenter(r, i) - KO_CARD_H / 2,
                }}>
                  <KnockoutCardInner
                    match={match}
                    slotLabels={SLOTS[match.id]}
                    prediction={saved[match.id]}
                    onClick={() => handleMatchTap(match)}
                  />
                </div>
              ))
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
            onClick={() => handleMatchTap(thirdPlace)}
          />
        </div>
      )}

      {/* Prediction modal */}
      {selectedMatch && user && (
        <PredictionModal
          match={selectedMatch}
          userId={user.id}
          existing={saved[selectedMatch.id]}
          open={true}
          onClose={() => setSelectedMatch(null)}
        />
      )}
    </div>
  );
}
