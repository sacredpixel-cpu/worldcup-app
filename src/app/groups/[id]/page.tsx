'use client';

import { useParams, useRouter } from 'next/navigation';
import { useAuthStore, useGroupsStore, usePredictionsStore } from '@/store';
import { ClientOnly } from '@/components/ui/ClientOnly';
import { calcPoints } from '@/lib/utils/calcPoints';
import { ALL_MATCHES } from '@/data/matches';
import Image from 'next/image';
import Link from 'next/link';

function GroupDetailContent() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const { getGroup, leaveGroup } = useGroupsStore();
  const { saved } = usePredictionsStore();

  const group = getGroup(params.id as string);

  if (!group) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-6">
        <p className="text-gray-500 mb-4">Group not found.</p>
        <Link href="/groups" className="text-brand-light hover:underline">← Back to Groups</Link>
      </div>
    );
  }

  // Build member leaderboard
  const userPts = (() => {
    const finished = ALL_MATCHES.filter(m => m.status === 'finished' && m.homeScore !== null);
    let pts = 0;
    finished.forEach(m => {
      const p = saved[m.id];
      if (!p) return;
      pts += calcPoints(p, { homeScore: m.homeScore!, awayScore: m.awayScore! });
    });
    return pts;
  })();

  const members = group.members
    .map(m => ({
      ...m,
      totalPoints: m.userId === user?.id ? userPts : m.totalPoints,
    }))
    .sort((a, b) => b.totalPoints - a.totalPoints);

  return (
    <div className="flex flex-col pb-4">
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-white">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-6 w-6">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <div>
          <h1 className="text-xl font-black text-gray-900">{group.name}</h1>
          <p className="text-xs text-gray-400">{group.members.length} members · Code: {group.inviteCode}</p>
        </div>
      </div>

      <div className="flex flex-col gap-2 px-4">
        {members.map((m, i) => (
          <div
            key={m.userId}
            className={`flex items-center gap-3 rounded-xl px-4 py-3 ${m.userId === user?.id ? 'border border-brand/40 bg-brand/10' : 'bg-card'}`}
          >
            <span className="w-6 text-center text-sm font-bold text-gray-400">{i + 1}</span>
            {m.avatarUrl ? (
              <Image src={m.avatarUrl} alt={m.displayName} width={36} height={36} className="rounded-full" unoptimized />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-sm font-bold text-gray-900">
                {m.displayName[0].toUpperCase()}
              </div>
            )}
            <span className={`flex-1 text-sm font-semibold ${m.userId === user?.id ? 'text-brand-light' : 'text-white'}`}>
              {m.displayName}{m.userId === user?.id ? ' (You)' : ''}
            </span>
            <span className="text-lg font-black text-gold">{m.totalPoints}</span>
          </div>
        ))}
      </div>

      {user && group.members.some(m => m.userId === user.id) && (
        <button
          onClick={() => { leaveGroup(group.id, user.id); router.push('/groups'); }}
          className="mx-4 mt-6 rounded-xl border border-accent/30 py-2.5 text-sm font-semibold text-accent/70 hover:text-accent"
        >
          Leave Group
        </button>
      )}
    </div>
  );
}

export default function GroupDetailPage() {
  return (
    <ClientOnly fallback={<div className="h-64 animate-pulse" />}>
      <GroupDetailContent />
    </ClientOnly>
  );
}
