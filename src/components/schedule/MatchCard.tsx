'use client';

import { useState } from 'react';
import { FlagImage } from '@/components/ui/FlagImage';
import { PredictionModal } from '@/components/predictions/PredictionModal';
import { PointsBadge } from '@/components/predictions/PointsBadge';
import type { Match } from '@/types/match';
import type { Prediction } from '@/types/prediction';
import { formatKickoff } from '@/lib/utils/formatDate';
import { STAGE_LABELS } from '@/data/matches';
import { ROSTERS } from '@/data/rosters';
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
      <span className="text-[10px]" style={{ color: '#5A6E94' }}>{role}</span>
    </div>
  );
}

export function MatchCard({ match, userPrediction, allUserPredictions, isAuthenticated, userId }: MatchCardProps) {
  const { getLiveMatch } = useMatchesStore();
  const liveMatch = getLiveMatch(match);
  const { community } = usePredictionsStore();
  const [modalOpen, setModalOpen] = useState(false);

  const isTbd = liveMatch.homeTeam.id === 'tbd';
  const isLive = liveMatch.status === 'live';
  const isFinished = liveMatch.status === 'finished';
  const isLocked = new Date(liveMatch.kickoffAt) <= new Date() || liveMatch.status !== 'upcoming';
  const hasScore = liveMatch.homeScore !== null;
  const hasPrediction = !!userPrediction;

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
        {/* Top: stage label + live/FT badge */}
        <div className="flex items-center justify-between px-4 pt-3 pb-1">
          <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: '#5A6E94' }}>
            {liveMatch.homeTeam.group ? `Group ${liveMatch.homeTeam.group} · ` : ''}{STAGE_LABELS[liveMatch.stage]}
          </span>
          <div className="flex items-center gap-2">
            {isLive && (
              <div className="flex items-center gap-1.5 rounded-full px-2.5 py-0.5" style={{ background: 'rgba(255,176,32,0.1)', border: '1px solid rgba(255,176,32,0.2)' }}>
                <LivePulse />
                <span className="text-[11px] font-bold" style={{ color: '#FFB020' }}>
                  {liveMatch.status === 'live' ? 'LIVE' : ''}
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
          <div className="flex flex-col items-center justify-center px-1">
            {hasScore ? (
              <div
                className="flex items-baseline gap-1 rounded-2xl px-4 py-2"
                style={{ background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <span style={{ fontFamily: 'var(--font-barlow-condensed)', fontSize: '40px', fontWeight: 900, color: '#E8F0FF', lineHeight: 1 }}>
                  {liveMatch.homeScore}
                </span>
                <span style={{ fontFamily: 'var(--font-barlow-condensed)', fontSize: '26px', fontWeight: 700, color: '#3A4E6E', lineHeight: 1, margin: '0 2px' }}>:</span>
                <span style={{ fontFamily: 'var(--font-barlow-condensed)', fontSize: '40px', fontWeight: 900, color: '#E8F0FF', lineHeight: 1 }}>
                  {liveMatch.awayScore}
                </span>
              </div>
            ) : (
              <div
                className="flex flex-col items-center gap-0.5 rounded-2xl px-5 py-2"
                style={{ background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.06)', minWidth: '80px' }}
              >
                <span style={{ fontFamily: 'var(--font-barlow-condensed)', fontSize: '18px', fontWeight: 900, color: '#3A4E6E', letterSpacing: '0.15em' }}>VS</span>
                {crowd && (
                  <span className="text-[12px] font-bold" style={{ color: '#FFB020' }}>
                    {crowd.homeAvg}–{crowd.awayAvg}
                  </span>
                )}
              </div>
            )}
          </div>

          <TeamBlock team={liveMatch.awayTeam} role="Away" />
        </div>

        {/* Crowd prediction bar */}
        {liveMatch.status === 'upcoming' && crowd && (
          <div className="px-4 pb-1">
            <div className="flex overflow-hidden rounded-full" style={{ height: '3px', background: 'rgba(255,255,255,0.05)' }}>
              <div style={{ width: `${crowd.homePct}%`, background: '#FF1F8E' }} />
              <div style={{ width: `${crowd.drawPct}%`, background: '#1A2A42' }} />
              <div style={{ width: `${crowd.awayPct}%`, background: '#00C44F' }} />
            </div>
            <div className="mt-1.5 flex items-center justify-between">
              <span className="text-[10px] font-semibold" style={{ color: '#FF1F8E' }}>{crowd.homePct}%</span>
              <span className="text-[10px]" style={{ color: '#5A6E94' }}>{crowd.count.toLocaleString()} predictions</span>
              <span className="text-[10px] font-semibold" style={{ color: '#00C44F' }}>{crowd.awayPct}%</span>
            </div>
          </div>
        )}

        {/* Footer */}
        <div
          className="mx-3 mb-3 mt-2 flex items-center justify-between gap-2 rounded-xl px-3 py-2"
          style={{ background: 'rgba(0,0,0,0.2)' }}
        >
          <span className="truncate text-[11px]" style={{ color: '#5A6E94' }}>
            {formatKickoff(liveMatch.kickoffAt)} · {liveMatch.city}
          </span>
          <div className="shrink-0">
            {userPrediction && isFinished ? (
              <PointsBadge prediction={userPrediction} match={liveMatch} />
            ) : isAuthenticated && !isLocked && hasPrediction ? (
              <span className="whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold" style={{ background: 'rgba(255,31,142,0.1)', color: '#FF1F8E', border: '1px solid rgba(255,31,142,0.2)' }}>
                ✓ {userPrediction!.homeScore}–{userPrediction!.awayScore}
              </span>
            ) : isAuthenticated && !isLocked ? (
              <span className="whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold" style={{ background: 'rgba(255,255,255,0.04)', color: '#FF1F8E', border: '1px solid rgba(255,31,142,0.15)' }}>
                + Predict
              </span>
            ) : isAuthenticated && isLocked && hasPrediction ? (
              <span className="whitespace-nowrap text-[11px]" style={{ color: '#5A6E94' }}>
                {userPrediction!.homeScore}–{userPrediction!.awayScore} · locked
              </span>
            ) : !isAuthenticated && !isTbd && !isLocked ? (
              <span className="whitespace-nowrap text-[11px]" style={{ color: '#5A6E94' }}>Sign in to predict</span>
            ) : null}
          </div>
        </div>
      </div>

      {!isTbd && isAuthenticated && userId && (
        <PredictionModal
          match={liveMatch}
          userId={userId}
          existing={userPrediction}
          open={modalOpen}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
}
