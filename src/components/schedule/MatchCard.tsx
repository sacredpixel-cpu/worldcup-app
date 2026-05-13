'use client';

import { FlagImage } from '@/components/ui/FlagImage';
import { Badge } from '@/components/ui/Badge';
import { PredictionInput } from '@/components/predictions/PredictionInput';
import { CrowdCompare } from '@/components/predictions/CrowdCompare';
import { PointsBadge } from '@/components/predictions/PointsBadge';
import type { Match } from '@/types/match';
import type { Prediction } from '@/types/prediction';
import { formatKickoff } from '@/lib/utils/formatDate';
import { STAGE_LABELS } from '@/data/matches';
import { usePredictionsStore } from '@/store/slices/predictionsSlice';

interface MatchCardProps {
  match: Match;
  userPrediction?: Prediction;
  allUserPredictions: Prediction[];
  isAuthenticated: boolean;
  userId?: string;
}

function TeamBlock({ team, score, side }: {
  team: Match['homeTeam'];
  score: number | null;
  side: 'home' | 'away';
}) {
  const isTbd = team.id === 'tbd';
  return (
    <div className={`flex flex-1 flex-col items-center gap-1 ${side === 'away' ? '' : ''}`}>
      {isTbd ? (
        <div className="h-8 w-12 rounded-sm bg-white/5 flex items-center justify-center text-white/20 text-xs">TBD</div>
      ) : (
        <FlagImage code={team.code} size={40} />
      )}
      <span className="text-center text-xs font-semibold text-white leading-tight max-w-[80px]">
        {isTbd ? 'TBD' : team.name}
      </span>
      {score !== null && (
        <span className="text-2xl font-black text-white">{score}</span>
      )}
    </div>
  );
}

export function MatchCard({ match, userPrediction, allUserPredictions, isAuthenticated, userId }: MatchCardProps) {
  const { community } = usePredictionsStore();
  const matchPredictions = community.filter(p => p.matchId === match.id);
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
  const isTbd = match.homeTeam.id === 'tbd';

  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3">
      {/* Stage + status badges */}
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-wider text-white/30">
          {match.homeTeam.group ? `Group ${match.homeTeam.group} · ` : ''}{STAGE_LABELS[match.stage]}
        </span>
        {match.status === 'live' && <Badge variant="live">LIVE</Badge>}
        {match.status === 'finished' && <Badge variant="gray">FT</Badge>}
      </div>

      {/* Teams vs Score */}
      <div className="flex items-center justify-between gap-2">
        <TeamBlock team={match.homeTeam} score={match.homeScore} side="home" />

        <div className="flex flex-col items-center gap-0.5">
          {match.status === 'upcoming' ? (
            <>
              <span className="text-xs font-bold text-white">VS</span>
              {crowd && (
                <span className="text-[10px] text-gold font-semibold">{crowd.homeAvg}–{crowd.awayAvg}</span>
              )}
            </>
          ) : (
            <span className="text-2xl font-black text-white">–</span>
          )}
        </div>

        <TeamBlock team={match.awayTeam} score={match.awayScore} side="away" />
      </div>

      {/* Crowd compare bar */}
      {!isTbd && crowd && match.status === 'upcoming' && (
        <CrowdCompare
          homeAvg={crowd.homeAvg}
          awayAvg={crowd.awayAvg}
          count={crowd.count}
          homeTeamName={match.homeTeam.name}
          awayTeamName={match.awayTeam.name}
        />
      )}

      {/* Date / venue */}
      <div className="mt-2 flex items-center justify-between text-[11px] text-white/40">
        <span>{formatKickoff(match.kickoffAt)}</span>
        <span className="truncate max-w-[140px] text-right">{match.city}</span>
      </div>

      {/* Points badge for finished matches */}
      {userPrediction && match.status === 'finished' && (
        <div className="mt-1.5 flex justify-end">
          <PointsBadge prediction={userPrediction} match={match} />
        </div>
      )}

      {/* Prediction input for authenticated users */}
      {isAuthenticated && !isTbd && userId && (
        <PredictionInput match={match} userId={userId} existing={userPrediction} />
      )}

      {/* CTA for unauthenticated */}
      {!isAuthenticated && !isTbd && match.status === 'upcoming' && (
        <p className="mt-2 text-center text-xs text-white/30">Sign in to predict the score</p>
      )}
    </div>
  );
}
