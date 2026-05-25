'use client';

import { useState } from 'react';
import { FlagImage } from '@/components/ui/FlagImage';
import { Badge } from '@/components/ui/Badge';
import { PredictionModal } from '@/components/predictions/PredictionModal';
import { CrowdCompare } from '@/components/predictions/CrowdCompare';
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

function TeamBlock({ team, score }: {
  team: Match['homeTeam'];
  score: number | null;
}) {
  const isTbd = team.id === 'tbd';
  const nickname = ROSTERS[team.id]?.nickname;
  return (
    <div className="flex flex-1 flex-col items-center gap-0.5">
      {isTbd ? (
        <div className="h-8 w-12 rounded-sm bg-white/5 flex items-center justify-center text-gray-300 text-xs">TBD</div>
      ) : (
        <FlagImage code={team.code} size={40} />
      )}
      <span className="text-center text-xs font-semibold text-gray-900 leading-tight max-w-[80px]">
        {isTbd ? 'TBD' : team.name}
      </span>
      {nickname && (
        <span className="text-center text-[10px] text-gray-400 leading-tight max-w-[80px]">{nickname}</span>
      )}
      {score !== null && (
        <span className="text-2xl font-black text-gray-900">{score}</span>
      )}
    </div>
  );
}

export function MatchCard({ match, userPrediction, allUserPredictions, isAuthenticated, userId }: MatchCardProps) {
  const { getLiveMatch } = useMatchesStore();
  const liveMatch = getLiveMatch(match);
  const { community } = usePredictionsStore();
  const [modalOpen, setModalOpen] = useState(false);

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
  const isTbd = liveMatch.homeTeam.id === 'tbd';
  const isLocked = new Date(liveMatch.kickoffAt) <= new Date() || liveMatch.status !== 'upcoming';
  const hasPrediction = !!userPrediction;

  return (
    <>
      <div
        className="rounded-xl border border-border bg-card px-4 py-3 cursor-pointer active:scale-[0.99] transition-transform"
        onClick={() => !isTbd && setModalOpen(true)}
      >
        {/* Stage + status badges */}
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-wider text-gray-400">
            {liveMatch.homeTeam.group ? `Group ${liveMatch.homeTeam.group} · ` : ''}{STAGE_LABELS[liveMatch.stage]}
          </span>
          <div className="flex items-center gap-1.5">
            {liveMatch.status === 'live' && <Badge variant="live">LIVE</Badge>}
            {liveMatch.status === 'finished' && <Badge variant="gray">FT</Badge>}
          </div>
        </div>

        {/* Teams vs Score */}
        <div className="flex items-center justify-between gap-2">
          <TeamBlock team={liveMatch.homeTeam} score={liveMatch.homeScore} />

          <div className="flex flex-col items-center gap-0.5">
            {liveMatch.status === 'upcoming' ? (
              <>
                <span className="text-xs font-bold text-gray-900">VS</span>
                {crowd && (
                  <span className="text-[10px] text-gold font-semibold">{crowd.homeAvg}–{crowd.awayAvg}</span>
                )}
              </>
            ) : (
              <span className="text-2xl font-black text-gray-900">–</span>
            )}
          </div>

          <TeamBlock team={liveMatch.awayTeam} score={liveMatch.awayScore} />
        </div>

        {/* Crowd compare bar */}
        {!isTbd && crowd && liveMatch.status === 'upcoming' && (
          <CrowdCompare
            homeAvg={crowd.homeAvg}
            awayAvg={crowd.awayAvg}
            count={crowd.count}
            homeTeamName={liveMatch.homeTeam.name}
            awayTeamName={liveMatch.awayTeam.name}
          />
        )}

        {/* Date / venue */}
        <div className="mt-2 flex items-center justify-between text-[11px] text-gray-400">
          <span>{formatKickoff(liveMatch.kickoffAt)}</span>
          <span className="truncate max-w-[140px] text-right">{liveMatch.city}</span>
        </div>

        {/* Bottom row: points + prediction status */}
        <div className="mt-2 flex items-center justify-between">
          {userPrediction && liveMatch.status === 'finished' ? (
            <PointsBadge prediction={userPrediction} match={liveMatch} />
          ) : (
            <span />
          )}

          {!isTbd && isAuthenticated && !isLocked && (
            <span className={`text-[11px] font-semibold ${hasPrediction ? 'text-brand-light' : 'text-gray-400'}`}>
              {hasPrediction
                ? `✓ ${userPrediction!.homeScore}–${userPrediction!.awayScore} · Tap to edit`
                : 'Tap to predict →'}
            </span>
          )}

          {!isTbd && isAuthenticated && isLocked && hasPrediction && (
            <span className="text-[11px] text-gray-500">
              Your pick: {userPrediction!.homeScore}–{userPrediction!.awayScore} · Locked
            </span>
          )}

          {!isAuthenticated && !isTbd && liveMatch.status === 'upcoming' && (
            <span className="text-[11px] text-gray-400">Sign in to predict</span>
          )}
        </div>
      </div>

      {/* Prediction modal */}
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
