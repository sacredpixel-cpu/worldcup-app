'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getPrediction } from '@/lib/predictionsService';
import type { Match } from '@/types/match';
import type { Prediction } from '@/types/prediction';

export function SharePageClient({ matchId, userId, match }: {
  matchId: string;
  userId: string;
  match: Match;
}) {
  const searchParams = useSearchParams();
  // Use URL params as the instant display (no flash of ?-?)
  const urlHome = searchParams.get('h');
  const urlAway = searchParams.get('a');

  const [pred, setPred] = useState<Prediction | null>(null);
  const [loading, setLoading] = useState(!urlHome);

  useEffect(() => {
    getPrediction(userId, matchId)
      .then(setPred)
      .catch(() => setPred(null))
      .finally(() => setLoading(false));
  }, [matchId, userId]);

  const home = match.homeTeam.name;
  const away = match.awayTeam.name;
  const homeFlag = `https://flagcdn.com/w160/${match.homeTeam.code.toLowerCase()}.png`;
  const awayFlag = `https://flagcdn.com/w160/${match.awayTeam.code.toLowerCase()}.png`;

  // Show Firestore result if loaded, otherwise fall back to URL params
  const displayHome = pred ? pred.homeScore : (urlHome ?? '?');
  const displayAway = pred ? pred.awayScore : (urlAway ?? '?');
  const scoreStr = loading && !urlHome ? '…' : `${displayHome}–${displayAway}`;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6" style={{ background: '#06091A' }}>
      <div className="w-full max-w-sm rounded-2xl p-6 text-center" style={{ background: '#0E1535', border: '1px solid rgba(255,255,255,0.08)' }}>
        {/* Header */}
        <p className="mb-1 text-xs uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>FIFA World Cup 2026</p>
        <p className="mb-5 text-xs font-bold" style={{ color: '#FF1F8E' }}>My Prediction</p>

        {/* Teams + score */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-1 flex-col items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={homeFlag} alt={home} className="h-12 w-16 object-cover rounded-md" />
            <p className="text-sm font-bold" style={{ color: '#E8F0FF' }}>{home}</p>
          </div>

          <div className="flex flex-col items-center">
            <p className="text-5xl font-black" style={{ color: '#FF1F8E' }}>{scoreStr}</p>
          </div>

          <div className="flex flex-1 flex-col items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={awayFlag} alt={away} className="h-12 w-16 object-cover rounded-md" />
            <p className="text-sm font-bold" style={{ color: '#E8F0FF' }}>{away}</p>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-6 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <p className="text-xs mb-3" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Settle the scores — predict your own, follow the schedule, and compete on leaderboards!
          </p>
          <Link
            href="https://myworldcupschedule.com/schedule"
            className="block w-full rounded-xl py-3 text-sm font-bold text-white active:scale-95"
            style={{ background: '#FF1F8E' }}
          >
            Make Your Prediction →
          </Link>
        </div>
      </div>
    </div>
  );
}
