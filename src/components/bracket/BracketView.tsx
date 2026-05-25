'use client';

import { KNOCKOUT_MATCHES } from '@/data/matches';
import { FlagImage } from '@/components/ui/FlagImage';
import type { Match } from '@/types/match';

const CARD_H = 48;   // total card height (2 rows × 24px)
const CARD_W = 112;  // card width
const COL_GAP = 24;  // horizontal gap between round columns (where connectors live)
const PAIR_GAP = 6;  // vertical gap between bracket pairs in R32

// y-center of match at position idx in round r (0 = R32)
function yCenter(round: number, idx: number): number {
  if (round === 0) {
    return idx * CARD_H + Math.floor(idx / 2) * PAIR_GAP + CARD_H / 2;
  }
  return (yCenter(round - 1, idx * 2) + yCenter(round - 1, idx * 2 + 1)) / 2;
}

const BRACKET_ROUNDS: { stage: Match['stage']; label: string; count: number }[] = [
  { stage: 'round-of-32',  label: 'R32',   count: 16 },
  { stage: 'round-of-16',  label: 'R16',   count: 8  },
  { stage: 'quarter-final', label: 'QF',   count: 4  },
  { stage: 'semi-final',   label: 'SF',    count: 2  },
  { stage: 'final',        label: 'Final', count: 1  },
];

function BracketCard({ match }: { match: Match }) {
  const isTbd = match.homeTeam.id === 'tbd';
  const isFinished = match.status === 'finished' && match.homeScore !== null;
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
      border: '1px solid rgba(255,255,255,0.09)',
      borderRadius: 7,
      overflow: 'hidden',
    }}>
      {(['home', 'away'] as const).map((side, i) => {
        const team = side === 'home' ? match.homeTeam : match.awayTeam;
        const score = side === 'home' ? match.homeScore : match.awayScore;
        const isWin = winnerSide === side;
        const isLoss = winnerSide !== null && !isWin;
        return (
          <div
            key={side}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '0 8px',
              height: CARD_H / 2,
              borderBottom: i === 0 ? '1px solid rgba(255,255,255,0.06)' : undefined,
              background: isWin ? 'rgba(255,31,142,0.10)' : undefined,
            }}
          >
            {isTbd ? (
              <div style={{ width: 16, height: 11, borderRadius: 2, background: 'rgba(255,255,255,0.07)', flexShrink: 0 }} />
            ) : (
              <FlagImage code={team.code} size={16} />
            )}
            <span style={{
              flex: 1,
              fontSize: 10,
              fontWeight: isWin ? 700 : 500,
              color: isTbd ? '#3A4E6E' : isLoss ? '#4A5E7E' : '#9AAED4',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {isTbd ? 'TBD' : team.code}
            </span>
            {isFinished && score !== null && (
              <span style={{
                fontSize: 12,
                fontWeight: 800,
                color: isWin ? '#FF4DA8' : '#5A6E94',
                fontFamily: 'var(--font-barlow-condensed)',
                minWidth: 14,
                textAlign: 'right',
              }}>
                {score}
              </span>
            )}
          </div>
        );
      })}
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
  // height = last R32 match bottom (15 cards + 7 pair gaps + 1 card height)
  const totalH = 15 * CARD_H + 7 * PAIR_GAP + CARD_H;

  // Build SVG bracket connector paths
  const paths: { d: string; key: string }[] = [];
  for (let r = 0; r < BRACKET_ROUNDS.length - 1; r++) {
    const x1 = r * (CARD_W + COL_GAP) + CARD_W;       // right edge of this column
    const x2 = (r + 1) * (CARD_W + COL_GAP);           // left edge of next column
    const xMid = (x1 + x2) / 2;
    const nextCount = BRACKET_ROUNDS[r + 1].count;

    for (let i = 0; i < nextCount; i++) {
      const topC = yCenter(r, i * 2);
      const botC = yCenter(r, i * 2 + 1);
      const nextC = yCenter(r + 1, i);
      // Top match → elbow → next match
      paths.push({ d: `M${x1} ${topC} H${xMid} V${nextC} H${x2}`, key: `t-${r}-${i}` });
      // Bottom match → same elbow midpoint
      paths.push({ d: `M${x1} ${botC} H${xMid} V${nextC}`, key: `b-${r}-${i}` });
    }
  }

  return (
    <div style={{ paddingBottom: 24 }}>
      {/* Horizontally scrollable bracket */}
      <div style={{ overflowX: 'auto', paddingLeft: 16, paddingRight: 16, paddingBottom: 4 }}>
        {/* Round labels */}
        <div style={{ display: 'flex', gap: COL_GAP, marginBottom: 8, width: totalW }}>
          {BRACKET_ROUNDS.map(r => (
            <div key={r.stage} style={{ width: CARD_W, flexShrink: 0, textAlign: 'center' }}>
              <span style={{
                fontSize: 9,
                fontWeight: 700,
                color: '#5A6E94',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}>
                {r.label}
              </span>
            </div>
          ))}
        </div>

        {/* Bracket canvas */}
        <div style={{ position: 'relative', width: totalW, height: totalH }}>
          {/* SVG connector lines */}
          <svg
            style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'visible' }}
            width={totalW}
            height={totalH}
          >
            {paths.map(({ d, key }) => (
              <path
                key={key}
                d={d}
                fill="none"
                stroke="rgba(90,110,148,0.3)"
                strokeWidth={1}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}
          </svg>

          {/* Match cards, absolutely positioned */}
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
          <div style={{ marginBottom: 6 }}>
            <span style={{
              fontSize: 9,
              fontWeight: 700,
              color: '#5A6E94',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}>
              3rd Place
            </span>
          </div>
          <div style={{ width: CARD_W }}>
            <BracketCard match={thirdPlace} />
          </div>
        </div>
      )}
    </div>
  );
}
