'use client';

import { useParams, useRouter } from 'next/navigation';
import { useAuthStore, useGroupsStore, usePredictionsStore } from '@/store';
import { ClientOnly } from '@/components/ui/ClientOnly';
import { calcPoints } from '@/lib/utils/calcPoints';
import { ALL_MATCHES } from '@/data/matches';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

function GroupDetailContent() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const { getGroup, leaveGroup, removeMember } = useGroupsStore();
  const { saved } = usePredictionsStore();
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const group = getGroup(params.id as string);

  if (!group) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-6">
        <p className="text-gray-500 mb-4">Group not found.</p>
        <Link href="/groups" className="text-brand-light hover:underline">← Back to Groups</Link>
      </div>
    );
  }

  const isCreator = user?.id === group.creatorId;

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

  async function handleRemove(memberId: string) {
    if (confirmId !== memberId) {
      setConfirmId(memberId);
      return;
    }
    setConfirmId(null);
    setRemovingId(memberId);
    try {
      await removeMember(group.id, memberId);
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <div className="flex flex-col pb-4">
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-700">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-6 w-6">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <div>
          <h1 className="text-xl font-black text-gray-900">{group.name}</h1>
          <p className="text-xs text-gray-400">
            {group.members.length} members · Code: {group.inviteCode}
            {isCreator && <span className="ml-2 text-brand font-semibold">· You're the admin</span>}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2 px-4">
        {members.map((m, i) => {
          const isMe = m.userId === user?.id;
          const isConfirming = confirmId === m.userId;
          const isRemoving = removingId === m.userId;

          return (
            <div
              key={m.userId}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 ${isMe ? 'border border-brand/40 bg-brand/10' : 'bg-card'}`}
            >
              <span className="w-6 text-center text-sm font-bold text-gray-400">{i + 1}</span>
              {m.avatarUrl ? (
                <Image src={m.avatarUrl} alt={m.displayName} width={36} height={36} className="rounded-full object-cover" unoptimized />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">
                  {m.displayName[0].toUpperCase()}
                </div>
              )}
              <span className={`flex-1 text-sm font-semibold ${isMe ? 'text-brand' : 'text-gray-900'}`}>
                {m.displayName}
                {isMe && <span className="ml-1 text-xs text-gray-400">(You)</span>}
                {m.userId === group.creatorId && !isMe && (
                  <span className="ml-1 text-[10px] text-brand/70 font-normal">admin</span>
                )}
              </span>
              <span className="text-lg font-black text-gold mr-1">{m.totalPoints}</span>

              {/* Remove button — creator only, not for themselves */}
              {isCreator && !isMe && (
                <button
                  onClick={() => handleRemove(m.userId)}
                  disabled={isRemoving}
                  className={`flex items-center justify-center rounded-lg px-2 py-1 text-xs font-semibold transition-all active:scale-95 disabled:opacity-40 ${
                    isConfirming
                      ? 'bg-red-500 text-white animate-pulse'
                      : 'border border-gray-200 text-gray-400 hover:border-red-300 hover:text-red-500'
                  }`}
                >
                  {isRemoving ? '…' : isConfirming ? 'Confirm?' : '✕'}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Tap outside confirm to cancel */}
      {confirmId && (
        <p className="mt-2 text-center text-xs text-gray-400">Tap ✕ again to confirm removal</p>
      )}

      {user && group.members.some(m => m.userId === user.id) && !isCreator && (
        <button
          onClick={() => { leaveGroup(group.id, user.id); router.push('/groups'); }}
          className="mx-4 mt-6 rounded-xl border border-red-200 py-2.5 text-sm font-semibold text-red-400 hover:text-red-600 hover:border-red-400 transition-colors"
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
