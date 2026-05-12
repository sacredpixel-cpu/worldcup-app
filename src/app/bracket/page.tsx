'use client';

import { KNOCKOUT_MATCHES, STAGE_LABELS } from '@/data/matches';
import { FlagImage } from '@/components/ui/FlagImage';
import { Badge } from '@/components/ui/Badge';
import { formatKickoff } from '@/lib/utils/formatDate';
import type { Match } from '@/types/match';

const STAGES: Match['stage'][] = ['round-of-32', 'round-of-16', 'quarter-final', 'semi-final', 'third-place', 'final'];

function BracketMatchRow({ match }: { match: Match }) {
  const isTbd = match.homeTeam.id === 'tbd';
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Team rows */}
      {[
        { team: match.homeTeam, score: match.homeScore },
        { team: match.awayTeam, score: match.awayScore },
      ].map(({ team, score }, i) => (
        <div key={i} className={`flex items-center gap-3 px-3 py-2.5 ${i === 0 ? 'border-b border-border/50' : ''}`}>
          {isTbd ? (
            <div className="h-5 w-7 rounded-sm bg-white/5" />
          ) : (
            <FlagImage code={team.code} size={28} />
          )}
          <span className={`flex-1 text-sm font-semibold ${isTbd ? 'text-white/20' : 'text-white'}`}>
            {isTbd ? 'TBD' : team.name}
          </span>
          {match.status !== 'upcoming' && score !== null && (
            <span className="text-lg font-black text-white">{score}</span>
          )}
        </div>
      ))}
      {/* Match info */}
      <div className="flex items-center justify-between border-t border-border/50 bg-surface/50 px-3 py-1.5">
        <span className="text-[10px] text-white/30">{formatKickoff(match.kickoffAt)}</span>
        {match.status === 'live' && <Badge variant="live">LIVE</Badge>}
        {match.status === 'finished' && <Badge variant="gray">FT</Badge>}
      </div>
    </div>
  );
}

export default function BracketPage() {
  // Countdown to tournament
  const tournamentStart = new Date('2026-06-11T20:00:00Z');
  const now = new Date();
  const daysLeft = Math.max(0, Math.ceil((tournamentStart.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

  return (
    <div className="flex flex-col pb-4">
      <div className="px-4 pt-4 pb-3">
        <h1 className="text-xl font-black text-white">Bracket</h1>
        <p className="text-xs text-white/40">Knockout stage — Jun 29 · Jul 19</p>
      </div>

      {daysLeft > 0 && (
        <div className="mx-4 mb-4 rounded-xl bg-brand/10 border border-brand/30 px-4 py-4 text-center">
          <p className="text-3xl font-black text-white">{daysLeft}</p>
          <p className="text-sm text-brand-light">days until kickoff</p>
          <p className="mt-1 text-xs text-white/40">Jun 11, 2026 · Group Stage begins</p>
        </div>
      )}

      {STAGES.map(stage => {
        const matches = KNOCKOUT_MATCHES.filter(m => m.stage === stage);
        return (
          <div key={stage} className="mb-6">
            <h2 className="mb-2 px-4 text-sm font-bold uppercase tracking-wider text-white/40">
              {STAGE_LABELS[stage]}
            </h2>
            <div className={`grid gap-3 px-4 ${stage === 'round-of-32' ? 'grid-cols-2' : 'grid-cols-1'}`}>
              {matches.map(m => (
                <BracketMatchRow key={m.id} match={m} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
