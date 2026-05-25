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
    <div className="rounded-xl overflow-hidden" style={{ background: '#0A1128', border: '1px solid rgba(255,255,255,0.07)' }}>
      {[
        { team: match.homeTeam, score: match.homeScore },
        { team: match.awayTeam, score: match.awayScore },
      ].map(({ team, score }, i) => (
        <div key={i} className="flex items-center gap-3 px-3 py-2.5" style={i === 0 ? { borderBottom: '1px solid rgba(255,255,255,0.06)' } : undefined}>
          {isTbd ? (
            <div className="h-5 w-7 rounded-sm" style={{ background: 'rgba(255,255,255,0.05)' }} />
          ) : (
            <FlagImage code={team.code} size={28} />
          )}
          <span className="flex-1 text-sm font-semibold" style={{ color: isTbd ? '#5A6E94' : '#E8F0FF' }}>
            {isTbd ? 'TBD' : team.name}
          </span>
          {match.status !== 'upcoming' && score !== null && (
            <span className="text-lg font-black" style={{ color: '#E8F0FF', fontFamily: 'var(--font-barlow-condensed)' }}>{score}</span>
          )}
        </div>
      ))}
      <div className="flex items-center justify-between px-3 py-1.5" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)' }}>
        <span className="text-[10px]" style={{ color: '#7A91BB' }}>{formatKickoff(match.kickoffAt)}</span>
        {match.status === 'live' && <Badge variant="live">LIVE</Badge>}
        {match.status === 'finished' && <Badge variant="gray">FT</Badge>}
      </div>
    </div>
  );
}

export function BracketView() {
  const tournamentStart = new Date('2026-06-11T20:00:00Z');
  const daysLeft = Math.max(0, Math.ceil((tournamentStart.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)));

  return (
    <div className="flex flex-col py-3">
      {daysLeft > 0 && (
        <div className="mx-4 mb-4 rounded-xl px-4 py-4 text-center" style={{ background: 'rgba(255,31,142,0.08)', border: '1px solid rgba(255,31,142,0.2)' }}>
          <p className="text-3xl font-black" style={{ color: '#E8F0FF', fontFamily: 'var(--font-barlow-condensed)' }}>{daysLeft}</p>
          <p className="text-sm" style={{ color: '#FF4DA8' }}>days until kickoff</p>
          <p className="mt-1 text-xs" style={{ color: '#7A91BB' }}>Jun 11, 2026 · Group Stage begins</p>
        </div>
      )}

      {STAGES.map(stage => {
        const matches = KNOCKOUT_MATCHES.filter(m => m.stage === stage);
        return (
          <div key={stage} className="mb-5">
            <h2 className="mb-2 px-4 text-xs font-bold uppercase tracking-widest" style={{ color: '#5A6E94' }}>
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
