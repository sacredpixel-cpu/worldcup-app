'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getPrediction } from '@/lib/predictionsService';
import type { Match } from '@/types/match';
import type { Prediction } from '@/types/prediction';

export function SharePageClient({ matchId, userId, match }: {
  matchId: string;
  userId: string;
  match: Match;
}) {
  const [pred, setPred] = useState<Prediction | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPrediction(userId, matchId)
      .then(setPred)
      .catch(() => setPred(null))
      .finally(() => setLoading(false));
  }, [matchId, userId]);

  const home = match.homeTeam.name;
  const away = match.awayTeam.name;
  const homeFlag = `https://flagcdn.com/w80/${match.homeTeam.code.toLowerCase()}.png`;
  const awayFlag = `https://flagcdn.com/w80/${match.awayTeam.code.toLowerCase()}.png`;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#FBFAF7] px-6">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-white p-6 text-center shadow-sm">
        {/* Header */}
        <p className="mb-1 text-xs uppercase tracking-widest text-gray-400">FIFA World Cup 2026</p>
        <p className="mb-6 text-xs text-gray-400">My Prediction</p>

        {/* Teams + score */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-1 flex-col items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={homeFlag} alt={home} className="h-10 w-14 object-cover rounded-sm" />
            <p className="text-sm font-bold text-gray-900">{home}</p>
          </div>

          <div className="flex flex-col items-center">
            {loading ? (
              <p className="text-2xl font-bold text-gray-300 animate-pulse">– – –</p>
            ) : pred ? (
              <p className="text-4xl font-black text-brand">{pred.homeScore}–{pred.awayScore}</p>
            ) : (
              <p className="text-2xl font-bold text-gray-400">?–?</p>
            )}
          </div>

          <div className="flex flex-1 flex-col items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={awayFlag} alt={away} className="h-10 w-14 object-cover rounded-sm" />
            <p className="text-sm font-bold text-gray-900">{away}</p>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-6 border-t border-border pt-4">
          <p className="text-xs text-gray-500 mb-3">
            Settle the scores at MyWorldCupSchedule.com — predict your own scores, follow the schedule, and compete on leaderboards!
          </p>
          <Link
            href="https://myworldcupschedule.com/schedule"
            className="block w-full rounded-xl bg-brand py-3 text-sm font-bold text-white active:scale-95"
          >
            Make Your Prediction →
          </Link>
        </div>
      </div>
    </div>
  );
}
