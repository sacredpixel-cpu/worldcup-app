'use client';

import { useMemo, useState } from 'react';
import { ALL_MATCHES } from '@/data/matches';
import { MatchCard } from '@/components/schedule/MatchCard';
import { useAuthStore, usePredictionsStore } from '@/store';
import { useMatchesStore } from '@/store/slices/matchesSlice';
import { computeKnockoutTeams, resolveMatchTeams } from '@/lib/utils/knockoutAdvancement';
import { ClientOnly } from '@/components/ui/ClientOnly';

function ScoresContent() {
  const { user } = useAuthStore();
  const { saved } = usePredictionsStore();
  const { updates, getLiveMatch } = useMatchesStore();
  const [filter, setFilter] = useState<'all' | 'live' | 'finished'>('all');

  // Resolve real team names for knockout matches as rounds complete
  const ktm = useMemo(() => computeKnockoutTeams(updates), [updates]);

  // Build fully resolved match list: live scores + real team names
  const resolvedMatches = useMemo(
    () => ALL_MATCHES.map(m => resolveMatchTeams(getLiveMatch(m), ktm)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [updates, ktm],
  );

  const filtered = resolvedMatches.filter(m => {
    if (filter === 'all') return m.status === 'live' || m.status === 'finished';
    return m.status === filter;
  });

  const live = resolvedMatches.filter(m => m.status === 'live');
  const allSaved = Object.values(saved);

  return (
    <div className="flex flex-col pb-4">
      <div className="px-4 pt-4 pb-2">
        <h1 className="text-2xl font-black" style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#E8F0FF', letterSpacing: '0.02em' }}>SCORES</h1>
      </div>

      {live.length > 0 && (
        <div className="mx-4 mb-3 rounded-xl bg-red-500/10 border border-red-500/30 px-3 py-2 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-sm text-red-400 font-semibold">{live.length} match{live.length !== 1 ? 'es' : ''} live right now</span>
        </div>
      )}

      <div className="flex gap-2 px-4 mb-3">
        {(['all', 'live', 'finished'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="no-press-ring rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition-colors"
            style={filter === f ? { background: 'rgba(255,255,255,0.85)', color: '#06091A' } : { background: 'rgba(255,255,255,0.05)', color: '#7A91BB', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            {f === 'all' ? 'All Results' : f === 'live' ? '🔴 Live' : 'Finished'}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-center px-6">
          <div className="mb-3 text-4xl">⏱️</div>
          <p className="text-sm" style={{ color: '#7A91BB' }}>No matches in this category yet.</p>
          <p className="text-xs mt-1" style={{ color: '#5A6E94' }}>Tournament begins June 11, 2026</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3 px-4">
          {filtered.map(m => (
            <MatchCard
              key={m.id}
              match={m}
              userPrediction={saved[m.id]}
              allUserPredictions={allSaved}
              isAuthenticated={!!user}
              userId={user?.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ScoresPage() {
  return (
    <ClientOnly fallback={<div className="h-64 animate-pulse" />}>
      <ScoresContent />
    </ClientOnly>
  );
}
