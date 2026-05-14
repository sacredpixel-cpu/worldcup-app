'use client';

import { useMemo } from 'react';
import { useAuthStore, usePredictionsStore } from '@/store';
import { ALL_MATCHES } from '@/data/matches';
import { MatchCard } from '@/components/schedule/MatchCard';
import { ClientOnly } from '@/components/ui/ClientOnly';
import Link from 'next/link';

function PredictionsContent() {
  const { user } = useAuthStore();
  const { saved } = usePredictionsStore();

  const myMatches = useMemo(() => {
    if (!user) return [];
    return ALL_MATCHES.filter(m => saved[m.id]);
  }, [user, saved]);

  const upcoming = myMatches.filter(m => m.status === 'upcoming');
  const live = myMatches.filter(m => m.status === 'live');
  const finished = myMatches.filter(m => m.status === 'finished');

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
        <div className="mb-4 text-5xl">🎯</div>
        <h2 className="mb-2 text-xl font-bold text-gray-900">Your Picks</h2>
        <p className="mb-6 text-sm text-gray-500">Sign in to start making predictions and earn points</p>
        <Link href="/auth/register" className="rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-gray-900">
          Create Account
        </Link>
      </div>
    );
  }

  if (myMatches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
        <div className="mb-4 text-5xl">🎯</div>
        <h2 className="mb-2 text-xl font-bold text-gray-900">No Picks Yet</h2>
        <p className="mb-6 text-sm text-gray-500">Head to the schedule to start predicting match scores</p>
        <Link href="/schedule" className="rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-gray-900">
          View Schedule
        </Link>
      </div>
    );
  }

  const allSaved = Object.values(saved);

  function Section({ title, matches }: { title: string; matches: typeof myMatches }) {
    if (matches.length === 0) return null;
    return (
      <div className="mb-6">
        <h2 className="mb-3 px-4 text-sm font-bold uppercase tracking-wider text-gray-400">{title}</h2>
        <div className="flex flex-col gap-3 px-4">
          {matches.map(m => (
            <MatchCard
              key={m.id}
              match={m}
              userPrediction={saved[m.id]}
              allUserPredictions={allSaved}
              isAuthenticated
              userId={user.id}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col pb-4">
      <div className="px-4 pt-4 pb-3">
        <h1 className="text-xl font-black text-gray-900">My Picks</h1>
        <p className="text-xs text-gray-400">{myMatches.length} predictions made</p>
      </div>
      <Section title="Live" matches={live} />
      <Section title="Upcoming" matches={upcoming} />
      <Section title="Finished" matches={finished} />
    </div>
  );
}

export default function PredictionsPage() {
  return (
    <ClientOnly fallback={<div className="h-64 animate-pulse" />}>
      <PredictionsContent />
    </ClientOnly>
  );
}
