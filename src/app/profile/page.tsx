'use client';

import { useAuthStore, usePredictionsStore, useGroupsStore } from '@/store';
import { ClientOnly } from '@/components/ui/ClientOnly';
import { ALL_MATCHES } from '@/data/matches';
import { calcPoints } from '@/lib/utils/calcPoints';
import { useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';

const AVATARS = ['⚽', '🏆', '🥅', '🎯', '🦁', '🐯', '🦅', '🌍', '⭐', '🔥', '💫', '🎪'];

function ProfileContent() {
  const { user, clearAuth } = useAuthStore();
  const { saved } = usePredictionsStore();
  const { groups } = useGroupsStore();

  const stats = useMemo(() => {
    if (!user) return null;
    const preds = Object.values(saved);
    const finished = ALL_MATCHES.filter(m => m.status === 'finished' && m.homeScore !== null);
    let pts = 0, exact = 0, correct = 0;
    finished.forEach(m => {
      const p = saved[m.id];
      if (!p) return;
      const earned = calcPoints(p, { homeScore: m.homeScore!, awayScore: m.awayScore! });
      pts += earned;
      if (earned === 5) exact++;
      if (earned >= 3) correct++;
    });
    const totalPredictions = preds.length;
    const accuracy = totalPredictions > 0 ? Math.round((correct / Math.max(finished.length, 1)) * 100) : 0;
    return { pts, exact, correct, totalPredictions, accuracy };
  }, [user, saved]);

  const myGroups = groups.filter(g => user && g.members.some(m => m.userId === user.id));

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
        <div className="mb-4 text-5xl">👤</div>
        <h2 className="mb-2 text-xl font-bold text-white">Your Profile</h2>
        <p className="mb-6 text-sm text-white/50">Sign in to track your stats and compete with friends</p>
        <div className="flex flex-col gap-3 w-full">
          <Link href="/auth/register" className="block w-full rounded-xl bg-brand py-3.5 text-center text-sm font-semibold text-white">
            Create Account
          </Link>
          <Link href="/auth/login" className="block w-full rounded-xl border border-border py-3.5 text-center text-sm font-semibold text-white">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col pb-4">
      {/* Avatar + name */}
      <div className="flex flex-col items-center px-4 pt-6 pb-4">
        {user.avatarUrl ? (
          <Image src={user.avatarUrl} alt={user.displayName} width={80} height={80} className="rounded-full mb-3" unoptimized />
        ) : (
          <div className="mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-brand text-3xl font-black text-white">
            {user.displayName[0].toUpperCase()}
          </div>
        )}
        <h1 className="text-xl font-black text-white">{user.displayName}</h1>
        <p className="text-sm text-white/40">{user.email}</p>
      </div>

      {/* Stats grid */}
      {stats && (
        <div className="mx-4 mb-4 grid grid-cols-2 gap-3">
          {[
            { label: 'Total Points', value: stats.pts, color: 'text-gold' },
            { label: 'Predictions', value: stats.totalPredictions, color: 'text-white' },
            { label: 'Exact Scores', value: stats.exact, color: 'text-brand-light' },
            { label: 'Accuracy', value: `${stats.accuracy}%`, color: 'text-white' },
          ].map(s => (
            <div key={s.label} className="rounded-xl bg-card p-4 text-center">
              <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
              <p className="text-xs text-white/40 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* My Groups */}
      {myGroups.length > 0 && (
        <div className="mx-4 mb-4">
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wider text-white/40">My Groups</h2>
          <div className="flex flex-col gap-2">
            {myGroups.map(g => (
              <Link
                key={g.id}
                href={`/groups/${g.id}`}
                className="flex items-center justify-between rounded-xl bg-card px-4 py-3"
              >
                <span className="text-sm font-semibold text-white">{g.name}</span>
                <span className="text-xs text-white/40">{g.members.length} members →</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Scoring legend */}
      <div className="mx-4 mb-4 rounded-xl border border-border bg-card p-4">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-white/40">Scoring Rules</h2>
        {[
          { pts: '5 pts', desc: 'Exact scoreline', color: 'text-gold' },
          { pts: '3 pts', desc: 'Correct outcome (W/D/L)', color: 'text-brand-light' },
          { pts: '4 pts', desc: 'Correct finalist', color: 'text-blue-400' },
          { pts: '10 pts', desc: 'Correct champion', color: 'text-yellow-400' },
        ].map(r => (
          <div key={r.desc} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
            <span className="text-sm text-white/70">{r.desc}</span>
            <span className={`text-sm font-bold ${r.color}`}>{r.pts}</span>
          </div>
        ))}
      </div>

      {/* Sign out */}
      <button
        onClick={clearAuth}
        className="mx-4 rounded-xl border border-accent/30 py-3 text-sm font-semibold text-accent/70 hover:text-accent transition-colors"
      >
        Sign Out
      </button>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <ClientOnly fallback={<div className="h-64 animate-pulse" />}>
      <ProfileContent />
    </ClientOnly>
  );
}
