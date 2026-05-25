'use client';

import { useMemo, useState, useEffect } from 'react';
import { useAuthStore, usePredictionsStore, useGroupsStore } from '@/store';
import { subscribeToUserProfiles, type UserProfile } from '@/lib/usersService';
import { ALL_MATCHES } from '@/data/matches';
import { calcPoints } from '@/lib/utils/calcPoints';
import { calcGroupPoints } from '@/lib/utils/calcGroupPoints';
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
  return <span className="w-8 text-center text-sm font-bold" style={{ color: '#7A91BB' }}>{rank}</span>;
}

function LeaderboardRow({ entry, rank, isMe, profile }: { entry: LeaderboardEntry; rank: number; isMe: boolean; profile?: UserProfile }) {
  const location = profile?.countryCode
    ? `${profile.countryCode === 'us' && profile.state ? profile.state + ', ' : ''}${profile.country}`
    : null;
  // Prefer the latest avatar from Firestore over the snapshot in the entry
  const avatarUrl = profile?.avatarUrl ?? entry.avatarUrl;

  return (
    <div className={`flex items-center gap-3 rounded-xl px-4 py-3 ${isMe ? 'border border-brand/40 bg-brand/10' : 'bg-card'}`}>
      <RankBadge rank={rank} />
      {avatarUrl ? (
        <Image src={avatarUrl} alt={entry.displayName} width={36} height={36} className="rounded-full object-cover" unoptimized />
      ) : (
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-sm font-bold text-gray-900">
          {entry.displayName[0].toUpperCase()}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className={`truncate text-sm font-semibold ${isMe ? 'text-brand-light' : 'text-white'}`}>
          {entry.displayName} {isMe && '(You)'}
        </p>
        {location ? (
          <div className="flex items-center gap-1 mt-0.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`https://flagcdn.com/w20/${profile!.countryCode}.png`} alt="" className="h-3 w-4 object-cover rounded-sm" />
            <span className="text-xs truncate" style={{ color: '#7A91BB' }}>{location}</span>
          </div>
        ) : (
          <p className="text-xs" style={{ color: '#7A91BB' }}>
            {entry.correctScores} exact · {entry.correctOutcomes} correct
          </p>
        )}
      </div>
      <div className="text-right">
        <p className="text-lg font-black text-gold">{entry.totalPoints}</p>
        <p className="text-[10px]" style={{ color: '#7A91BB' }}>pts</p>
      </div>
    </div>
  );
}

function LeaderboardContent() {
  const { user } = useAuthStore();
  const { saved } = usePredictionsStore();
  const { groups } = useGroupsStore();
  const [tab, setTab] = useState<'global' | string>('global');
  const [userProfiles, setUserProfiles] = useState<Record<string, UserProfile>>({});

  useEffect(() => {
    const unsub = subscribeToUserProfiles(setUserProfiles);
    return () => unsub();
  }, []);

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
    // Add group-advancement prediction points (+3 winner, +2 runner-up, +1 third)
    pts += calcGroupPoints(saved).total;
    return { userId: user.id, displayName: user.displayName, avatarUrl: user.avatarUrl, totalPoints: pts, correctScores: exact, correctOutcomes: correct };
  }, [user, saved]);

  const globalBoard = useMemo(() => {
    const tournamentStart = new Date('2026-06-11T00:00:00');
    const showMocks = new Date() < tournamentStart;
    const all = showMocks ? [...MOCK_USERS] : [];
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
        <h1 className="text-2xl font-black" style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#E8F0FF', letterSpacing: '0.02em' }}>LEADERBOARD</h1>
      </div>

      {/* Tab selector */}
      <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-3">
        <button
          onClick={() => setTab('global')}
          className="flex-shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors"
          style={tab === 'global'
            ? { background: '#FF1F8E', color: '#06091A' }
            : { background: 'rgba(255,255,255,0.05)', color: '#7A91BB', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          Global
        </button>
        {myGroups.map(g => (
          <button
            key={g.id}
            onClick={() => setTab(g.id)}
            className="flex-shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors"
            style={tab === g.id
              ? { background: '#FF1F8E', color: '#06091A' }
              : { background: 'rgba(255,255,255,0.05)', color: '#7A91BB', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            {g.name}
          </button>
        ))}
      </div>

      {/* Your rank summary */}
      {user && userRank > 0 && (
        <div className="mx-4 mb-3 flex items-center justify-between rounded-xl px-4 py-2.5" style={{ background: 'rgba(255,31,142,0.08)', border: '1px solid rgba(255,31,142,0.2)' }}>
          <span className="text-sm" style={{ color: '#7A91BB' }}>Your rank</span>
          <span className="text-2xl font-black" style={{ color: '#FF4DA8', fontFamily: 'var(--font-barlow-condensed)' }}>#{userRank}</span>
          <span className="text-sm font-semibold" style={{ color: '#FFB020' }}>{userEntry?.totalPoints ?? 0} pts</span>
        </div>
      )}

      {!user && (
        <div className="mx-4 mb-3 rounded-xl px-4 py-4 text-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <p className="text-sm mb-2" style={{ color: '#7A91BB' }}>Sign in to appear on the leaderboard</p>
          <Link href="/auth/register" className="text-sm hover:underline" style={{ color: '#FF4DA8' }}>Create an account →</Link>
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
            profile={userProfiles[entry.userId]}
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
