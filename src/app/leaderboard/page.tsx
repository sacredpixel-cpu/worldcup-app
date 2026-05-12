'use client';

import { useMemo, useState } from 'react';
import { useAuthStore, usePredictionsStore, useGroupsStore } from '@/store';
import { ALL_MATCHES } from '@/data/matches';
import { calcPoints } from '@/lib/utils/calcPoints';
import { ClientOnly } from '@/components/ui/ClientOnly';
import Image from 'next/image';
import Link from 'next/link';

interface LeaderboardEntry {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  totalPoints: number;
  correctScores: number;
  correctOutcomes: number;
}

// Seed mock global users
const MOCK_USERS: LeaderboardEntry[] = [
  { userId: 'mock-1', displayName: 'Cristiano_Fan', avatarUrl: `https://i.pravatar.cc/150?u=1`, totalPoints: 42, correctScores: 3, correctOutcomes: 9 },
  { userId: 'mock-2', displayName: 'GoalKing88', avatarUrl: `https://i.pravatar.cc/150?u=2`, totalPoints: 38, correctScores: 2, correctOutcomes: 8 },
  { userId: 'mock-3', displayName: 'TacticsMaestro', avatarUrl: `https://i.pravatar.cc/150?u=3`, totalPoints: 35, correctScores: 1, correctOutcomes: 8 },
  { userId: 'mock-4', displayName: 'SoccerOracle', avatarUrl: `https://i.pravatar.cc/150?u=4`, totalPoints: 31, correctScores: 2, correctOutcomes: 7 },
  { userId: 'mock-5', displayName: 'PredictionKing', avatarUrl: `https://i.pravatar.cc/150?u=5`, totalPoints: 28, correctScores: 1, correctOutcomes: 7 },
  { userId: 'mock-6', displayName: 'WorldCupWizard', avatarUrl: `https://i.pravatar.cc/150?u=6`, totalPoints: 25, correctScores: 0, correctOutcomes: 6 },
  { userId: 'mock-7', displayName: 'FootballGuru', avatarUrl: `https://i.pravatar.cc/150?u=7`, totalPoints: 22, correctScores: 1, correctOutcomes: 5 },
  { userId: 'mock-8', displayName: 'MatchAnalyst', avatarUrl: `https://i.pravatar.cc/150?u=8`, totalPoints: 18, correctScores: 0, correctOutcomes: 5 },
  { userId: 'mock-9', displayName: 'BallPark99', avatarUrl: `https://i.pravatar.cc/150?u=9`, totalPoints: 15, correctScores: 1, correctOutcomes: 4 },
  { userId: 'mock-10', displayName: 'TacticsNerd', avatarUrl: `https://i.pravatar.cc/150?u=10`, totalPoints: 12, correctScores: 0, correctOutcomes: 4 },
];

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-xl">🥇</span>;
  if (rank === 2) return <span className="text-xl">🥈</span>;
  if (rank === 3) return <span className="text-xl">🥉</span>;
  return <span className="w-8 text-center text-sm font-bold text-white/40">{rank}</span>;
}

function LeaderboardRow({ entry, rank, isMe }: { entry: LeaderboardEntry; rank: number; isMe: boolean }) {
  return (
    <div className={`flex items-center gap-3 rounded-xl px-4 py-3 ${isMe ? 'border border-brand/40 bg-brand/10' : 'bg-card'}`}>
      <RankBadge rank={rank} />
      {entry.avatarUrl ? (
        <Image src={entry.avatarUrl} alt={entry.displayName} width={36} height={36} className="rounded-full" unoptimized />
      ) : (
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">
          {entry.displayName[0].toUpperCase()}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className={`truncate text-sm font-semibold ${isMe ? 'text-brand-light' : 'text-white'}`}>
          {entry.displayName} {isMe && '(You)'}
        </p>
        <p className="text-xs text-white/40">
          {entry.correctScores} exact · {entry.correctOutcomes} correct
        </p>
      </div>
      <div className="text-right">
        <p className="text-lg font-black text-gold">{entry.totalPoints}</p>
        <p className="text-[10px] text-white/30">pts</p>
      </div>
    </div>
  );
}

function LeaderboardContent() {
  const { user } = useAuthStore();
  const { saved } = usePredictionsStore();
  const { groups } = useGroupsStore();
  const [tab, setTab] = useState<'global' | string>('global');

  const userEntry = useMemo<LeaderboardEntry | null>(() => {
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
    return { userId: user.id, displayName: user.displayName, avatarUrl: user.avatarUrl, totalPoints: pts, correctScores: exact, correctOutcomes: correct };
  }, [user, saved]);

  const globalBoard = useMemo(() => {
    const all = [...MOCK_USERS];
    if (userEntry) all.push(userEntry);
    return all.sort((a, b) => b.totalPoints - a.totalPoints);
  }, [userEntry]);

  const myGroups = groups.filter(g => user && g.members.some(m => m.userId === user.id));

  const groupBoard = useMemo(() => {
    if (tab === 'global') return null;
    const g = myGroups.find(g => g.id === tab);
    if (!g) return null;
    return g.members
      .map(m => ({
        userId: m.userId, displayName: m.displayName, avatarUrl: m.avatarUrl,
        totalPoints: m.userId === user?.id ? (userEntry?.totalPoints ?? 0) : m.totalPoints,
        correctScores: 0, correctOutcomes: 0,
      }))
      .sort((a, b) => b.totalPoints - a.totalPoints);
  }, [tab, myGroups, user, userEntry]);

  const board = tab === 'global' ? globalBoard : (groupBoard ?? globalBoard);
  const userRank = user ? board.findIndex(e => e.userId === user.id) + 1 : -1;

  return (
    <div className="flex flex-col">
      <div className="px-4 pt-4 pb-3">
        <h1 className="text-xl font-black text-white">Leaderboard</h1>
      </div>

      {/* Tab selector */}
      <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-3">
        <button
          onClick={() => setTab('global')}
          className={`flex-shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
            tab === 'global' ? 'bg-brand text-white' : 'bg-card text-white/50'
          }`}
        >
          Global
        </button>
        {myGroups.map(g => (
          <button
            key={g.id}
            onClick={() => setTab(g.id)}
            className={`flex-shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
              tab === g.id ? 'bg-brand text-white' : 'bg-card text-white/50'
            }`}
          >
            {g.name}
          </button>
        ))}
      </div>

      {/* Your rank summary */}
      {user && userRank > 0 && (
        <div className="mx-4 mb-3 flex items-center justify-between rounded-xl bg-brand/10 border border-brand/30 px-4 py-2.5">
          <span className="text-sm text-white/70">Your rank</span>
          <span className="text-2xl font-black text-brand-light">#{userRank}</span>
          <span className="text-sm text-gold font-semibold">{userEntry?.totalPoints ?? 0} pts</span>
        </div>
      )}

      {!user && (
        <div className="mx-4 mb-3 rounded-xl bg-card px-4 py-4 text-center">
          <p className="text-sm text-white/50 mb-2">Sign in to appear on the leaderboard</p>
          <Link href="/auth/register" className="text-sm text-brand-light hover:underline">Create an account →</Link>
        </div>
      )}

      {/* Board */}
      <div className="flex flex-col gap-2 px-4 pb-4">
        {board.slice(0, 50).map((entry, i) => (
          <LeaderboardRow
            key={entry.userId}
            entry={entry}
            rank={i + 1}
            isMe={entry.userId === user?.id}
          />
        ))}
      </div>
    </div>
  );
}

export default function LeaderboardPage() {
  return (
    <ClientOnly fallback={<div className="flex flex-col gap-3 p-4">{[...Array(8)].map((_, i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-card" />)}</div>}>
      <LeaderboardContent />
    </ClientOnly>
  );
}
