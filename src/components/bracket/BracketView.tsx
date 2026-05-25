'use client';

import { KNOCKOUT_MATCHES } from '@/data/matches';
import { FlagImage } from '@/components/ui/FlagImage';
import type { Match } from '@/types/match';

// Card dimensions
const CARD_H = 54;   // 2 team rows (19px each) + footer (14px) + 2px borders
const CARD_W = 120;  // wide enough for slot label text
const COL_GAP = 24;
const PAIR_GAP = 8;

// Bracket slot labels: who plays in each knockout match before teams are decided.
// Covers all 16 R32 matches, 8 R16, 4 QF, 2 SF, 3rd place, Final.
const SLOTS: Record<string, [string, string]> = {
  // Round of 32
  // Top half: Group winners (A-H) vs runners-up / best 3rd-place
  'R32-01': ['W Group A',    'Best 3rd'],
  'R32-02': ['W Group C',    'R/U Group A'],
  'R32-03': ['W Group B',    'Best 3rd'],
  'R32-04': ['W Group D',    'R/U Group B'],
  'R32-05': ['W Group E',    'Best 3rd'],
  'R32-06': ['W Group G',    'R/U Group C'],
  'R32-07': ['W Group F',    'Best 3rd'],
  'R32-08': ['W Group H',    'R/U Group D'],
  // Bottom half: Group winners (I-L) and runners-up face each other / 3rd place
  'R32-09': ['W Group I',    'R/U Group E'],
  'R32-10': ['W Group J',    'R/U Group F'],
  'R32-11': ['W Group K',    'R/U Group G'],
  'R32-12': ['W Group L',    'R/U Group H'],
  'R32-13': ['R/U Group I',  'Best 3rd'],
  'R32-14': ['R/U Group J',  'Best 3rd'],
  'R32-15': ['R/U Group K',  'Best 3rd'],
  'R32-16': ['R/U Group L',  'Best 3rd'],
  // Round of 16 — winner of the two feeder R32 matches
  'R16-01': ['W Match 1',    'W Match 2'],
  'R16-02': ['W Match 3',    'W Match 4'],
  'R16-03': ['W Match 5',    'W Match 6'],
  'R16-04': ['W Match 7',    'W Match 8'],
  'R16-05': ['W Match 9',    'W Match 10'],
  'R16-06': ['W Match 11',   'W Match 12'],
  'R16-07': ['W Match 13',   'W Match 14'],
  'R16-08': ['W Match 15',   'W Match 16'],
  // Quarter-Finals
  'QF-01':  ['W R16 #1',     'W R16 #2'],
  'QF-02':  ['W R16 #3',     'W R16 #4'],
  'QF-03':  ['W R16 #5',     'W R16 #6'],
  'QF-04':  ['W R16 #7',     'W R16 #8'],
  // Semi-Finals
  'SF-01':  ['W QF #1',      'W QF #2'],
  'SF-02':  ['W QF #3',      'W QF #4'],
  // Third Place
  '3RD':    ['L SF #1',      'L SF #2'],
  // Final
  'FINAL':  ['W SF #1',      'W SF #2'],
};

// y-center of match idx in round r (0 = R32)
function yCenter(round: number, idx: number): number {
  if (round === 0) {
    return idx * CARD_H + Math.floor(idx / 2) * PAIR_GAP + CARD_H / 2;
  }
  return (yCenter(round - 1, idx * 2) + yCenter(round - 1, idx * 2 + 1)) / 2;
}

const BRACKET_ROUNDS: { stage: Match['stage']; label: string; count: number }[] = [
  { stage: 'round-of-32',   label: 'Round of 32', count: 16 },
  { stage: 'round-of-16',   label: 'Round of 16', count: 8  },
  { stage: 'quarter-final', label: 'Quarters',    count: 4  },
  { stage: 'semi-final',    label: 'Semis',       count: 2  },
  { stage: 'final',         label: 'Final',       count: 1  },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
}
function shortCity(city: string) {
  return city.split(',')[0];
}

function BracketCard({ match }: { match: Match }) {
  const isTbd = match.homeTeam.id === 'tbd';
  const slots = SLOTS[match.id] ?? ['TBD', 'TBD'];
  const isFinished = match.status === 'finished' && match.homeScore !== null;
  const isLive = match.status === 'live';
  const winnerSide: 'home' | 'away' | null = isFinished
    ? match.homeScore! > match.awayScore! ? 'home'
    : match.homeScore! < match.awayScore! ? 'away'
    : null
    : null;

  return (
    <div style={{
      width: CARD_W,
      height: CARD_H,
      background: '#0C1430',
      border: isLive ? '1px solid rgba(255,31,142,0.4)' : '1px solid rgba(255,255,255,0.09)',
      borderRadius: 7,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {(['home', 'away'] as const).map((side, i) => {
        const team = side === 'home' ? match.homeTeam : match.awayTeam;
        const score = side === 'home' ? match.homeScore : match.awayScore;
        const slotLabel = slots[i];
        const isWin = winnerSide === side;
        const isLoss = winnerSide !== null && !isWin;
        return (
          <div
            key={side}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '0 7px',
              flex: '0 0 19px',
              borderBottom: i === 0 ? '1px solid rgba(255,255,255,0.06)' : undefined,
              background: isWin ? 'rgba(255,31,142,0.08)' : undefined,
            }}
          >
            {!isTbd && <FlagImage code={team.code} size={14} />}
            <span style={{
              flex: 1,
              fontSize: isTbd ? 9 : 10,
              fontWeight: isWin ? 700 : 500,
              color: isTbd ? '#4A5E7E' : isLoss ? '#4A5E7E' : '#9AAED4',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              lineHeight: 1,
            }}>
              {isTbd ? slotLabel : team.code}
            </span>
            {(isFinished || isLive) && score !== null && (
              <span style={{
                fontSize: 11,
                fontWeight: 800,
                color: isWin ? '#FF4DA8' : '#5A6E94',
                fontFamily: 'var(--font-barlow-condensed)',
                minWidth: 10,
                textAlign: 'right',
              }}>
                {score}
              </span>
            )}
          </div>
        );
      })}
      {/* Date + city footer */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        padding: '0 7px',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        background: 'rgba(0,0,0,0.2)',
        overflow: 'hidden',
      }}>
        <span style={{
          fontSize: 8,
          color: '#3A4E6E',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          lineHeight: 1,
        }}>
          {formatDate(match.kickoffAt)} · {shortCity(match.city)}
        </span>
      </div>
    </div>
  );
}

export function BracketView() {
  const matchesByStage: Partial<Record<Match['stage'], Match[]>> = {};
  for (const r of BRACKET_ROUNDS) {
    matchesByStage[r.stage] = KNOCKOUT_MATCHES.filter(m => m.stage === r.stage);
  }
  const thirdPlace = KNOCKOUT_MATCHES.find(m => m.stage === 'third-place');

  const totalW = BRACKET_ROUNDS.length * CARD_W + (BRACKET_ROUNDS.length - 1) * COL_GAP;
  const totalH = 15 * CARD_H + 7 * PAIR_GAP + CARD_H;

  // SVG bracket connector paths
  const paths: { d: string; key: string }[] = [];
  for (let r = 0; r < BRACKET_ROUNDS.length - 1; r++) {
    const x1 = r * (CARD_W + COL_GAP) + CARD_W;
    const x2 = (r + 1) * (CARD_W + COL_GAP);
    const xMid = (x1 + x2) / 2;
    const nextCount = BRACKET_ROUNDS[r + 1].count;
    for (let i = 0; i < nextCount; i++) {
      const topC = yCenter(r, i * 2);
      const botC = yCenter(r, i * 2 + 1);
      const nextC = yCenter(r + 1, i);
      paths.push({ d: `M${x1} ${topC} H${xMid} V${nextC} H${x2}`, key: `t-${r}-${i}` });
      paths.push({ d: `M${x1} ${botC} H${xMid} V${nextC}`,        key: `b-${r}-${i}` });
    }
  }

  return (
    <div style={{ paddingBottom: 24 }}>
      <div style={{ overflowX: 'auto', paddingLeft: 16, paddingRight: 16, paddingBottom: 4 }}>
        {/* Round labels */}
        <div style={{ display: 'flex', gap: COL_GAP, marginBottom: 8, width: totalW }}>
          {BRACKET_ROUNDS.map(r => (
            <div key={r.stage} style={{ width: CARD_W, flexShrink: 0, textAlign: 'center' }}>
              <span style={{ fontSize: 9, fontWeight: 700, color: '#5A6E94', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {r.label}
              </span>
            </div>
          ))}
        </div>

        {/* Bracket canvas */}
        <div style={{ position: 'relative', width: totalW, height: totalH }}>
          <svg
            style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'visible' }}
            width={totalW}
            height={totalH}
          >
            {paths.map(({ d, key }) => (
              <path key={key} d={d} fill="none" stroke="rgba(90,110,148,0.3)" strokeWidth={1} strokeLinecap="round" strokeLinejoin="round" />
            ))}
          </svg>

          {BRACKET_ROUNDS.map((round, r) =>
            (matchesByStage[round.stage] ?? []).map((match, i) => (
              <div
                key={match.id}
                style={{
                  position: 'absolute',
                  left: r * (CARD_W + COL_GAP),
                  top: yCenter(r, i) - CARD_H / 2,
                }}
              >
                <BracketCard match={match} />
              </div>
            ))
          )}
        </div>
      </div>

      {/* Third-place match */}
      {thirdPlace && (
        <div style={{ padding: '16px 16px 0' }}>
          <span style={{ fontSize: 9, fontWeight: 700, color: '#5A6E94', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>
            3rd Place
          </span>
          <div style={{ width: CARD_W }}>
            <BracketCard match={thirdPlace} />
          </div>
        </div>
      )}
    </div>
  );
}
