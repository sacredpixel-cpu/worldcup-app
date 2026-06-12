'use client';

import { useState, useEffect } from 'react';
import { FlagImage } from '@/components/ui/FlagImage';
import { PredictionModal } from '@/components/predictions/PredictionModal';
import { FirstPredictionModal } from '@/components/predictions/FirstPredictionModal';
import type { Match } from '@/types/match';
import type { Prediction } from '@/types/prediction';
import { formatKickoff } from '@/lib/utils/formatDate';
import { STAGE_LABELS } from '@/data/matches';
import { ROSTERS } from '@/data/rosters';
import { SCORING } from '@/lib/constants/scoring';
import { getMatchNumber } from '@/lib/utils/matchNumbers';
import { usePredictionsStore } from '@/store/slices/predictionsSlice';
import { useMatchesStore } from '@/store/slices/matchesSlice';

interface MatchCardProps {
  match: Match;
  userPrediction?: Prediction;
  allUserPredictions: Prediction[];
  isAuthenticated: boolean;
  userId?: string;
}

function LivePulse() {
  return (
    <span className="relative flex h-2 w-2 shrink-0">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60" style={{ backgroundColor: '#FFB020' }} />
      <span className="relative inline-flex h-2 w-2 rounded-full" style={{ backgroundColor: '#FFB020' }} />
    </span>
  );
}

function TeamBlock({ team, role }: { team: Match['homeTeam']; role: string }) {
  const isTbd = team.id === 'tbd';
  const nickname = ROSTERS[team.id]?.nickname;
  return (
    <div className="flex flex-1 flex-col items-center gap-1.5">
      <div
        className="flex h-14 w-14 items-center justify-center rounded-full"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1.5px solid rgba(255,255,255,0.08)' }}
      >
        {isTbd ? (
          <span className="text-xs font-bold" style={{ color: '#7A91BB' }}>TBD</span>
        ) : (
          <FlagImage code={team.code} size={38} className="rounded-sm" />
        )}
      </div>
      <span
        className="text-center font-black leading-tight"
        style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#E8F0FF', fontSize: '14px', letterSpacing: '0.04em' }}
      >
        {isTbd ? 'TBD' : team.name.toUpperCase()}
      </span>
      {nickname && (
        <span className="text-center text-[10px]" style={{ color: '#7A91BB' }}>{nickname}</span>
      )}
      <span className="text-[10px] font-semibold" style={{ color: role === 'Home' ? '#00C44F' : role === 'Away' ? '#FF1F8E' : '#5A6E94' }}>{role}</span>
    </div>
  );
}

// When each knockout match opens for predictions (day teams become known)
// Based on the official 2026 FIFA World Cup schedule
const PREDICT_OPENS: Record<string, string> = {
  // Round of 32 (Jun 28–Jul 3) — all group stage teams known Jun 28
  'R32-01': 'Jun 28', 'R32-02': 'Jun 28', 'R32-03': 'Jun 28', 'R32-04': 'Jun 28',
  'R32-05': 'Jun 28', 'R32-06': 'Jun 28', 'R32-07': 'Jun 28', 'R32-08': 'Jun 28',
  'R32-09': 'Jun 28', 'R32-10': 'Jun 28', 'R32-11': 'Jun 28', 'R32-12': 'Jun 28',
  'R32-13': 'Jun 28', 'R32-14': 'Jun 28', 'R32-15': 'Jun 28', 'R32-16': 'Jun 28',
  // Round of 16 — opens after both feeder R32 matches finish
  'R16-01': 'Jul 1',  // R32-02 (Jun 29) & R32-05 (Jun 30)
  'R16-02': 'Jun 30', // R32-01 (Jun 28) & R32-03 (Jun 29)
  'R16-03': 'Jul 1',  // R32-04 (Jun 29) & R32-06 (Jun 30)
  'R16-04': 'Jul 2',  // R32-07 (Jun 30) & R32-08 (Jul 1)
  'R16-05': 'Jul 3',  // R32-11 (Jul 2) & R32-12 (Jul 2)
  'R16-06': 'Jul 2',  // R32-09 (Jul 1) & R32-10 (Jul 1)
  'R16-07': 'Jul 4',  // R32-14 (Jul 3) & R32-16 (Jul 3)
  'R16-08': 'Jul 4',  // R32-13 (Jul 2) & R32-15 (Jul 3)
  // Quarter-finals — opens after both feeder R16 matches finish
  'QF-01': 'Jul 5',   // R16-01 (Jul 4) & R16-02 (Jul 4)
  'QF-02': 'Jul 7',   // R16-05 (Jul 6) & R16-06 (Jul 6)
  'QF-03': 'Jul 6',   // R16-03 (Jul 5) & R16-04 (Jul 5)
  'QF-04': 'Jul 8',   // R16-07 (Jul 7) & R16-08 (Jul 7)
  // Semi-finals — opens after both feeder QF matches finish
  'SF-01': 'Jul 11',  // QF-01 (Jul 9) & QF-02 (Jul 10)
  'SF-02': 'Jul 12',  // QF-03 (Jul 11) & QF-04 (Jul 11)
  // 3rd place + Final — both SFs play Jul 14–15
  '3RD':   'Jul 16',
  'FINAL': 'Jul 16',
};

function formatCountdown(kickoffAt: string): string | null {
  const diff = new Date(kickoffAt).getTime() - Date.now();
  if (diff <= 0) return null;
  const totalMins = Math.floor(diff / 60_000);
  const days  = Math.floor(totalMins / 1440);
  const hours = Math.floor((totalMins % 1440) / 60);
  const mins  = totalMins % 60;
  if (days > 0)  return `${days}d ${hours}h to predict`;
  if (hours > 0) return `${hours}h ${mins}m to predict`;
  if (mins > 0)  return `${mins}m to predict`;
  return '< 1 min to predict';
}

export function MatchCard({ match, userPrediction, allUserPredictions, isAuthenticated, userId }: MatchCardProps) {
  const { getLiveMatch } = useMatchesStore();
  const liveMatch = getLiveMatch(match);
  const { community } = usePredictionsStore();

  // Derive status booleans before useState so they can seed initial state
  const isTbd = liveMatch.homeTeam.id === 'tbd';
  const isLive = liveMatch.status === 'live' || liveMatch.status === 'halftime' ||
                 liveMatch.status === 'extratime' || liveMatch.status === 'penalties';
  const isFinished = liveMatch.status === 'finished';

  const [modalOpen, setModalOpen] = useState(false);
  const [breakdownOpen, setBreakdownOpen] = useState(false);
  // Stats panel: open by default when live, closed by default when finished
  const [statsOpen, setStatsOpen] = useState(() => isLive);
  const [showFirstPrediction, setShowFirstPrediction] = useState(false);

  // Auto-collapse stats when match transitions from live → finished
  useEffect(() => {
    if (isLive) setStatsOpen(true);
  }, [isLive]);
  useEffect(() => {
    if (isFinished) setStatsOpen(false);
  }, [isFinished]);
  const isLocked = new Date(liveMatch.kickoffAt) <= new Date() || liveMatch.status !== 'upcoming';
  const hasScore = liveMatch.homeScore !== null;
  const hasPrediction = !!userPrediction;

  // Live-ticking countdown — updates every 30 s so minutes stay accurate
  const [countdown, setCountdown] = useState<string | null>(() =>
    (!isLocked && !isTbd) ? formatCountdown(liveMatch.kickoffAt) : null
  );
  useEffect(() => {
    if (isLocked || isTbd) { setCountdown(null); return; }
    const tick = () => setCountdown(formatCountdown(liveMatch.kickoffAt));
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, [isLocked, isTbd, liveMatch.kickoffAt]);

  // Points breakdown — every rule always shown; na=true means rule didn't apply
  const breakdownItems = (() => {
    if (!isFinished || !hasPrediction || !hasScore) return [];
    const items: { label: string; pts: number; na?: boolean }[] = [];
    const actual = { homeScore: liveMatch.homeScore!, awayScore: liveMatch.awayScore! };
    const pred = userPrediction!;

    // ── 1. Score accuracy (always shown) ────────────────────────────────────
    const homeExact = pred.homeScore === actual.homeScore;
    const awayExact = pred.awayScore === actual.awayScore;
    items.push({
      label: `Home score — you: ${pred.homeScore} · result: ${actual.homeScore}`,
      pts: homeExact ? SCORING.CORRECT_SCORE_PER_TEAM : 0,
    });
    items.push({
      label: `Away score — you: ${pred.awayScore} · result: ${actual.awayScore}`,
      pts: awayExact ? SCORING.CORRECT_SCORE_PER_TEAM : 0,
    });

    // ── 2. Result (W/D/L) — always applied, stacks with exact score ────────────
    const predOut = Math.sign(pred.homeScore - pred.awayScore);
    const actOut  = Math.sign(actual.homeScore - actual.awayScore);
    items.push(predOut === actOut
      ? { label: 'Correct result (W/D/L)', pts: SCORING.CORRECT_OUTCOME }
      : { label: 'Wrong result',           pts: SCORING.WRONG_OUTCOME });

    // Build a goal-count map from a scorers array (duplicates = multi-goal)
    const buildGoalCounts = (scorers: string[]) => {
      const map = new Map<string, number>();
      for (const name of scorers) map.set(name, (map.get(name) ?? 0) + 1);
      return map;
    };

    // ── 3. Home scorer picks — always shown (0 if no pick made) ─────────────
    const homePicks = pred.homeScorerPicks ?? [];
    const homeGoalCounts = liveMatch.homeScorers ? buildGoalCounts(liveMatch.homeScorers) : null;
    if (homePicks.length === 0) {
      items.push({ label: 'Home scorer(s) — no pick', pts: 0 });
    } else {
      for (const pick of homePicks) {
        if (homeGoalCounts) {
          const goals = homeGoalCounts.get(pick) ?? 0;
          const pts   = goals > 0 ? goals * SCORING.CORRECT_SCORER : SCORING.WRONG_SCORER;
          const label = goals > 1
            ? `Home scorer: ${pick} (${goals} goals)`
            : `Home scorer: ${pick}`;
          items.push({ label, pts });
        } else {
          items.push({ label: `Home scorer: ${pick} — pending`, pts: 0, na: true });
        }
      }
    }

    // ── 4. Away scorer picks — always shown (0 if no pick made) ─────────────
    const awayPicks = pred.awayScorerPicks ?? [];
    const awayGoalCounts = liveMatch.awayScorers ? buildGoalCounts(liveMatch.awayScorers) : null;
    if (awayPicks.length === 0) {
      items.push({ label: 'Away scorer(s) — no pick', pts: 0 });
    } else {
      for (const pick of awayPicks) {
        if (awayGoalCounts) {
          const goals = awayGoalCounts.get(pick) ?? 0;
          const pts   = goals > 0 ? goals * SCORING.CORRECT_SCORER : SCORING.WRONG_SCORER;
          const label = goals > 1
            ? `Away scorer: ${pick} (${goals} goals)`
            : `Away scorer: ${pick}`;
          items.push({ label, pts });
        } else {
          items.push({ label: `Away scorer: ${pick} — pending`, pts: 0, na: true });
        }
      }
    }

    return items;
  })();
  const totalPts = breakdownItems.filter(i => !i.na).reduce((s, i) => s + i.pts, 0);

  // Community crowd data
  const matchPredictions = community.filter(p => p.matchId === liveMatch.id);
  const crowd = matchPredictions.length === 0 ? null : (() => {
    const avgHome = Math.round(matchPredictions.reduce((s, p) => s + p.homeScore, 0) / matchPredictions.length * 10) / 10;
    const avgAway = Math.round(matchPredictions.reduce((s, p) => s + p.awayScore, 0) / matchPredictions.length * 10) / 10;
    const homeWins = matchPredictions.filter(p => p.homeScore > p.awayScore).length;
    const draws = matchPredictions.filter(p => p.homeScore === p.awayScore).length;
    const awayWins = matchPredictions.length - homeWins - draws;
    return {
      homeAvg: avgHome,
      awayAvg: avgAway,
      count: matchPredictions.length,
      homePct: Math.round(homeWins / matchPredictions.length * 100),
      drawPct: Math.round(draws / matchPredictions.length * 100),
      awayPct: Math.round(awayWins / matchPredictions.length * 100),
    };
  })();

  return (
    <>
      <div
        className="press-ring overflow-hidden rounded-2xl cursor-pointer active:scale-[0.99] transition-transform"
        style={{
          background: 'linear-gradient(160deg, #0E1535 0%, #0A1128 100%)',
          border: isLive
            ? '1px solid rgba(255,176,32,0.25)'
            : '1px solid rgba(255,255,255,0.07)',
        }}
        onClick={() => !isTbd && setModalOpen(true)}
      >
        {/* Top: stage label + match number + live/FT badge */}
        <div className="flex items-center justify-between px-4 pt-3 pb-1">
          <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: '#5A6E94' }}>
            {liveMatch.homeTeam.group ? `Group ${liveMatch.homeTeam.group} · ` : ''}{STAGE_LABELS[liveMatch.stage]}
          </span>
          <div className="flex items-center gap-2">
            {getMatchNumber(liveMatch.id) !== null && (
              <span className="text-[10px] font-bold" style={{ color: '#3A4E6E' }}>
                M{getMatchNumber(liveMatch.id)}
              </span>
            )}
            {isLive && (
              <div className="flex items-center gap-1.5 rounded-full px-2.5 py-0.5" style={{ background: 'rgba(255,176,32,0.1)', border: '1px solid rgba(255,176,32,0.2)' }}>
                <LivePulse />
                <span className="text-[11px] font-bold" style={{ color: '#FFB020' }}>
                  {liveMatch.status === 'halftime' ? 'HT' :
                   liveMatch.status === 'extratime' ? 'ET' :
                   liveMatch.status === 'penalties' ? 'PENS' : 'LIVE'}
                </span>
              </div>
            )}
            {isFinished && (
              <span className="rounded-full px-2.5 py-0.5 text-[11px] font-bold" style={{ background: 'rgba(255,255,255,0.05)', color: '#7A91BB' }}>
                FT
              </span>
            )}
          </div>
        </div>

        {/* Teams + Score */}
        <div className="flex items-center px-3 py-2 gap-2">
          <TeamBlock team={liveMatch.homeTeam} role="Home" />

          {/* Score / VS box */}
          <div className="flex flex-col items-center justify-center px-1 gap-1.5">

            {/* Live / Final score — sits above the VS box when match has started */}
            {(isLive || isFinished) && hasScore && (
              <div className="flex flex-col items-center gap-0.5">
                {isFinished ? (
                  <span style={{ fontSize: '9px', fontWeight: 700, color: '#7A91BB', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Final</span>
                ) : (
                  <span className="relative flex h-2 w-2 shrink-0">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60" style={{ backgroundColor: '#EF4444' }} />
                    <span className="relative inline-flex h-2 w-2 rounded-full" style={{ backgroundColor: '#EF4444' }} />
                  </span>
                )}
                <div className="flex items-baseline gap-1">
                  <span style={{ fontFamily: 'var(--font-barlow-condensed)', fontSize: '38px', fontWeight: 900, color: '#E8F0FF', lineHeight: 1 }}>
                    {liveMatch.homeScore}
                  </span>
                  <span style={{ fontFamily: 'var(--font-barlow-condensed)', fontSize: '24px', fontWeight: 700, color: '#3A4E6E', lineHeight: 1, margin: '0 1px' }}>–</span>
                  <span style={{ fontFamily: 'var(--font-barlow-condensed)', fontSize: '38px', fontWeight: 900, color: '#E8F0FF', lineHeight: 1 }}>
                    {liveMatch.awayScore}
                  </span>
                </div>
              </div>
            )}

            {/* VS box — always visible */}
            <div
              className="flex flex-col items-center gap-1 rounded-2xl px-5 py-2"
              style={{ background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.06)', minWidth: '80px' }}
            >
              <span style={{ fontFamily: 'var(--font-barlow-condensed)', fontSize: '18px', fontWeight: 900, color: '#3A4E6E', letterSpacing: '0.15em' }}>VS</span>
              {isAuthenticated && !isLocked && hasPrediction ? (
                <div className="flex flex-col items-center gap-0.5">
                  <span className="text-[9px] font-semibold uppercase tracking-widest" style={{ color: '#FF1F8E' }}>Predicted</span>
                  <span className="flex w-full items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-[15px] font-bold" style={{ background: 'rgba(255,31,142,0.1)', color: '#FF1F8E', border: '1px solid rgba(255,31,142,0.2)', marginLeft: '-1.5px', marginRight: '-1.5px' }}>
                    <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5 shrink-0">
                      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                    </svg>
                    {userPrediction!.homeScore}–{userPrediction!.awayScore}
                  </span>
                </div>
              ) : isTbd && PREDICT_OPENS[liveMatch.id] ? (
                <div className="flex flex-col items-center gap-0.5">
                  <span className="text-[9px] font-semibold uppercase tracking-widest" style={{ color: '#5A6E94' }}>Predict on</span>
                  <span className="text-[12px] font-bold" style={{ color: '#7A91BB' }}>{PREDICT_OPENS[liveMatch.id]}</span>
                </div>
              ) : !isLocked && !isTbd && !hasPrediction ? (
                <>
                  {countdown && (
                    <span className="text-center text-[9px] font-semibold leading-tight" style={{ color: '#7A91BB' }}>
                      {countdown}
                    </span>
                  )}
                  {isAuthenticated && (
                    <span className="whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold" style={{ background: 'rgba(255,255,255,0.04)', color: '#FF1F8E', border: '1px solid rgba(255,31,142,0.15)' }}>
                      + Predict
                    </span>
                  )}
                </>
              ) : crowd ? (
                <span className="text-[12px] font-bold" style={{ color: '#FFB020' }}>
                  {crowd.homeAvg}–{crowd.awayAvg}
                </span>
              ) : null}
            </div>
          </div>

          <TeamBlock team={liveMatch.awayTeam} role="Away" />
        </div>

        {/* Crowd prediction bar — visible while upcoming or live, hidden after FT */}
        {(liveMatch.status === 'upcoming' || liveMatch.status === 'live') && crowd && (
          <div className="px-4 pb-1">
            <div className="flex overflow-hidden rounded-full" style={{ height: '3px', background: 'rgba(255,255,255,0.05)' }}>
              <div style={{ width: `${crowd.homePct}%`, background: '#00C44F' }} />
              <div style={{ width: `${crowd.drawPct}%`, background: '#1A2A42' }} />
              <div style={{ width: `${crowd.awayPct}%`, background: '#FF1F8E' }} />
            </div>
            <div className="mt-1.5 flex items-center justify-between">
              <span className="text-[10px] font-semibold" style={{ color: '#00C44F' }}>{crowd.homePct}%</span>
              <span className="text-[10px]" style={{ color: '#5A6E94' }}>{crowd.count.toLocaleString()} predictions</span>
              <span className="text-[10px] font-semibold" style={{ color: '#FF1F8E' }}>{crowd.awayPct}%</span>
            </div>
          </div>
        )}

        {/* Footer */}
        <div
          className={`mx-3 flex items-center justify-between gap-2 rounded-xl px-3 py-2 ${isFinished && hasPrediction ? 'mt-2 mb-0' : 'mt-2 mb-3'}`}
          style={{ background: 'rgba(0,0,0,0.2)' }}
        >
          <span className="truncate text-[11px]">
            <span style={{ color: '#7A91BB' }}>{formatKickoff(liveMatch.kickoffAt)}</span>
            <span style={{ color: '#5A6E94' }}> · {liveMatch.city}</span>
          </span>
          <div className="shrink-0">
            {isAuthenticated && !isLocked && hasPrediction && crowd ? (
              <div className="flex flex-col items-end gap-0.5">
                <span className="text-[9px] font-semibold uppercase tracking-widest" style={{ color: '#FFB020' }}>Average</span>
                <span className="whitespace-nowrap text-[12px] font-bold" style={{ color: '#FFB020' }}>
                  {crowd.homeAvg}–{crowd.awayAvg}
                </span>
              </div>
            ) : isAuthenticated && isLocked && hasPrediction && !isFinished ? (
              <span className="whitespace-nowrap text-[11px]" style={{ color: '#5A6E94' }}>
                {userPrediction!.homeScore}–{userPrediction!.awayScore} · locked
              </span>
            ) : !isAuthenticated && !isTbd && !isLocked ? (
              <span className="whitespace-nowrap text-[11px]" style={{ color: '#5A6E94' }}>Sign in to predict</span>
            ) : null}
          </div>
        </div>

        {/* Match Stats & Events — live and finished matches (above points breakdown) */}
        {(isLive || isFinished) && (liveMatch.matchEvents?.length || liveMatch.matchStats) && (
          <div className="mx-3 mb-0 mt-1 overflow-hidden rounded-xl" style={{ background: 'rgba(0,0,0,0.2)' }}>
            <button
              className="no-press-ring flex w-full items-center justify-between px-3 py-2.5"
              onClick={(e) => { e.stopPropagation(); setStatsOpen(o => !o); }}
            >
              <div className="flex items-center gap-1.5">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}
                  className="h-3 w-3 shrink-0 transition-transform"
                  style={{ color: '#7A91BB', transform: statsOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
                <span className="text-[11px] font-semibold" style={{ color: '#7A91BB' }}>Match stats</span>
              </div>
            </button>

            {statsOpen && (
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                {/* Events timeline */}
                {(liveMatch.matchEvents?.length ?? 0) > 0 && (
                  <div className="px-3 pt-2.5 pb-2 flex flex-col gap-1">
                    {liveMatch.matchEvents!.map((ev, i) => {
                      const icon = ev.type === 'goal' ? '⚽' : ev.type === 'yellow-card' ? '🟨' : '🟥';
                      const shortName = (name: string) => {
                        const parts = name.trim().split(' ');
                        if (parts.length <= 1) return name;
                        return `${parts[0][0]}. ${parts.slice(1).join(' ')}`;
                      };
                      return (
                        <div key={i} className="flex items-center gap-1">
                          {ev.teamSide === 'home' ? (
                            <>
                              <span className="flex-1 text-[10px] font-medium text-left truncate" style={{ color: '#C8D8F0' }}>
                                {icon} {shortName(ev.player)}
                              </span>
                              <span className="w-10 text-center text-[10px] font-bold shrink-0" style={{ color: '#5A6E94' }}>{ev.minute}</span>
                              <span className="flex-1" />
                            </>
                          ) : (
                            <>
                              <span className="flex-1" />
                              <span className="w-10 text-center text-[10px] font-bold shrink-0" style={{ color: '#5A6E94' }}>{ev.minute}</span>
                              <span className="flex-1 text-[10px] font-medium text-right truncate" style={{ color: '#C8D8F0' }}>
                                {shortName(ev.player)} {icon}
                              </span>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Stats */}
                {liveMatch.matchStats && (() => {
                  const s = liveMatch.matchStats!;
                  const homePct = s.homePossession || 50;
                  const statRows: Array<{ label: string; home: number; away: number }> = [
                    { label: 'Shots',     home: s.homeShots,         away: s.awayShots },
                    { label: 'On Target', home: s.homeShotsOnTarget, away: s.awayShotsOnTarget },
                    { label: 'Corners',   home: s.homeCorners,       away: s.awayCorners },
                    { label: 'Fouls',     home: s.homeFouls,         away: s.awayFouls },
                    { label: 'Offsides',  home: s.homeOffsides,      away: s.awayOffsides },
                  ];
                  return (
                    <div className="px-3 pb-3" style={{ borderTop: liveMatch.matchEvents?.length ? '1px solid rgba(255,255,255,0.05)' : undefined }}>
                      {/* Possession bar */}
                      <div className="pt-2.5 pb-2">
                        <div className="flex justify-between mb-1">
                          <span className="text-[10px] font-bold" style={{ color: '#FFB020' }}>{Math.round(homePct)}%</span>
                          <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#5A6E94' }}>Possession</span>
                          <span className="text-[10px] font-bold" style={{ color: '#60A5FA' }}>{Math.round(s.awayPossession || 50)}%</span>
                        </div>
                        <div className="flex h-1.5 w-full overflow-hidden rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                          <div style={{ width: `${homePct}%`, background: '#FFB020', borderRadius: '999px 0 0 999px', transition: 'width 0.4s ease' }} />
                          <div style={{ flex: 1, background: '#3B82F6', borderRadius: '0 999px 999px 0', transition: 'width 0.4s ease' }} />
                        </div>
                      </div>
                      {/* Stat comparison rows */}
                      {statRows.map((row) => {
                        const total = row.home + row.away || 1;
                        const homeBarPct = (row.home / total) * 100;
                        return (
                          <div key={row.label} className="flex items-center gap-2 py-1" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                            <span className="w-7 text-right text-[10px] font-bold shrink-0" style={{ color: '#E8F0FF' }}>{row.home}</span>
                            <div className="flex flex-1 h-1 overflow-hidden rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                              <div style={{ width: `${homeBarPct}%`, background: '#FFB020', borderRadius: '999px 0 0 999px' }} />
                              <div style={{ flex: 1, background: '#3B82F6', borderRadius: '0 999px 999px 0' }} />
                            </div>
                            <span className="w-7 text-left text-[10px] font-bold shrink-0" style={{ color: '#E8F0FF' }}>{row.away}</span>
                            <span className="w-16 text-left text-[10px] shrink-0" style={{ color: '#5A6E94' }}>{row.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        )}

        {/* Points breakdown — finished matches with a prediction only */}
        {isFinished && hasPrediction && (
          <div className="mx-3 mb-3 mt-1 overflow-hidden rounded-xl" style={{ background: 'rgba(0,0,0,0.2)' }}>
            <button
              className="no-press-ring flex w-full items-center justify-between px-3 py-2.5"
              onClick={(e) => { e.stopPropagation(); setBreakdownOpen(o => !o); }}
            >
              <div className="flex items-center gap-1.5">
                <svg
                  viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}
                  className="h-3 w-3 shrink-0 transition-transform"
                  style={{ color: '#7A91BB', transform: breakdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
                <span className="text-[11px] font-semibold" style={{ color: '#7A91BB' }}>Points breakdown</span>
              </div>
              <span
                className="text-[12px] font-black"
                style={{ color: totalPts > 0 ? '#FFB020' : totalPts < 0 ? '#FF4DA8' : '#7A91BB' }}
              >
                {totalPts > 0 ? '+' : ''}{totalPts} pts
              </span>
            </button>

            {breakdownOpen && (
              <div className="px-3 pb-2.5 flex flex-col gap-1" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                {breakdownItems.map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-1" style={{ borderBottom: i < breakdownItems.length - 1 ? '1px solid rgba(255,255,255,0.04)' : undefined }}>
                    <span className="text-[11px]" style={{ color: item.na ? '#3A4E6E' : '#7A91BB', fontStyle: item.na ? 'italic' : undefined }}>{item.label}</span>
                    <span
                      className="text-[11px] font-bold"
                      style={{ color: item.na ? '#3A4E6E' : item.pts > 0 ? '#00C44F' : item.pts < 0 ? '#FF4DA8' : '#5A6E94' }}
                    >
                      {item.na ? '—' : item.pts > 0 ? `+${item.pts}` : item.pts}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {!isTbd && isAuthenticated && userId && (
        <>
          <PredictionModal
            match={liveMatch}
            userId={userId}
            existing={userPrediction}
            open={modalOpen}
            onClose={() => setModalOpen(false)}
            onFirstEverPrediction={() => setShowFirstPrediction(true)}
          />
          <FirstPredictionModal
            open={showFirstPrediction}
            onClose={() => setShowFirstPrediction(false)}
          />
        </>
      )}
    </>
  );
}
