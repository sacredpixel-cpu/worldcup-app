'use client';

import { useParams, useRouter } from 'next/navigation';
import { useAuthStore, useGroupsStore, usePredictionsStore } from '@/store';
import { useMatchesStore } from '@/store/slices/matchesSlice';
import { ClientOnly } from '@/components/ui/ClientOnly';
import { calcPoints } from '@/lib/utils/calcPoints';
import { calcGroupPoints } from '@/lib/utils/calcGroupPoints';
import { ALL_MATCHES } from '@/data/matches';
import { subscribeToUserProfiles, type UserProfile } from '@/lib/usersService';
import { subscribeToCommunityPredictions } from '@/lib/predictionsService';
import type { Prediction } from '@/types/prediction';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect, useMemo } from 'react';

function GroupDetailContent() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const { getGroup, leaveGroup, removeMember } = useGroupsStore();
  const { saved } = usePredictionsStore();
  const { getLiveMatch, updates } = useMatchesStore();
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [userProfiles, setUserProfiles] = useState<Record<string, UserProfile>>({});
  const [allPredictions, setAllPredictions] = useState<Prediction[]>([]);

  useEffect(() => {
    const unsub = subscribeToUserProfiles(setUserProfiles);
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = subscribeToCommunityPredictions(setAllPredictions);
    return () => unsub();
  }, []);

  const group = getGroup(params.id as string);

  // Live finished matches with actual scores + scorers from Firestore
  const finishedMatches = useMemo(
    () => ALL_MATCHES.map(getLiveMatch).filter(m => m.status === 'finished' && m.homeScore !== null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [updates],
  );

  // Build member leaderboard — calculate every member's points dynamically
  const members = useMemo(() => {
    if (!group) return [];

    // Index community predictions by userId → matchId
    const predsByUser: Record<string, Record<string, Prediction>> = {};
    for (const pred of allPredictions) {
      if (!predsByUser[pred.userId]) predsByUser[pred.userId] = {};
      predsByUser[pred.userId][pred.matchId] = pred;
    }

    return group.members
      .map(m => {
        // For the current user, use the Zustand store (most up-to-date, includes unsaved changes)
        const preds: Record<string, Prediction> = m.userId === user?.id
          ? saved
          : (predsByUser[m.userId] ?? {});

        let pts = 0;
        finishedMatches.forEach(match => {
          const p = preds[match.id];
          if (!p) return;
          pts += calcPoints(p, {
            homeScore: match.homeScore!,
            awayScore: match.awayScore!,
            homeScorers: match.homeScorers,
            awayScorers: match.awayScorers,
          });
        });
        pts += calcGroupPoints(preds).total;

        return { ...m, totalPoints: pts };
      })
      .sort((a, b) => b.totalPoints - a.totalPoints);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group, allPredictions, saved, finishedMatches, user?.id]);

  if (!group) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-6">
        <p className="mb-4" style={{ color: '#7A91BB' }}>Group not found.</p>
        <Link href="/groups" className="text-brand-light hover:underline">← Back to Groups</Link>
      </div>
    );
  }

  const isCreator = user?.id === group.creatorId;

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
        <button onClick={() => router.back()} style={{ color: '#7A91BB' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-6 w-6">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <div>
          <h1 className="text-xl font-black" style={{ color: '#E8F0FF' }}>{group.name}</h1>
          <p className="text-xs" style={{ color: '#7A91BB' }}>
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
          const profile = userProfiles[m.userId];
          // Prefer the latest avatar from Firestore profiles over the snapshot stored at join time
          const avatarUrl = profile?.avatarUrl ?? m.avatarUrl;
          const location = profile?.countryCode
            ? (profile.countryCode === 'us' && profile.state ? `${profile.state}, ${profile.country}` : profile.country)
            : null;

          return (
            <div
              key={m.userId}
              className="flex items-center gap-3 rounded-xl px-4 py-3"
              style={isMe
                ? { background: 'rgba(255,31,142,0.08)', border: '1px solid rgba(255,31,142,0.3)' }
                : { background: '#0E1535', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <span className="w-6 text-center text-sm font-bold" style={{ color: '#7A91BB' }}>{i + 1}</span>
              {avatarUrl ? (
                <Image src={avatarUrl} alt={m.displayName} width={36} height={36} className="rounded-full object-cover" unoptimized />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold" style={{ background: '#FF1F8E', color: '#06091A' }}>
                  {m.displayName[0].toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className="truncate text-sm font-semibold" style={{ color: isMe ? '#FF1F8E' : '#E8F0FF' }}>
                    {m.displayName}
                  </span>
                  {isMe && <span className="text-xs" style={{ color: '#7A91BB' }}>(You)</span>}
                  {m.userId === group.creatorId && !isMe && (
                    <span className="text-[10px] text-brand/60 font-normal">admin</span>
                  )}
                </div>
                {location ? (
                  <div className="flex items-center gap-1 mt-0.5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`https://flagcdn.com/w20/${profile!.countryCode}.png`} alt="" className="h-3 w-4 object-cover rounded-sm" />
                    <span className="text-xs truncate" style={{ color: '#7A91BB' }}>{location}</span>
                  </div>
                ) : null}
              </div>
              <span className="text-lg font-black text-gold mr-1">{m.totalPoints}</span>

              {/* Remove button — creator only, not for themselves */}
              {isCreator && !isMe && (
                <button
                  onClick={() => handleRemove(m.userId)}
                  disabled={isRemoving}
                  className={`flex items-center justify-center rounded-lg px-2 py-1 text-xs font-semibold active:scale-95 disabled:opacity-40 ${isConfirming ? 'bg-red-500 text-white animate-pulse' : 'hover:text-red-400'}`}
                  style={!isConfirming ? { border: '1px solid rgba(255,255,255,0.12)', color: '#7A91BB' } : undefined}
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
        <p className="mt-2 text-center text-xs" style={{ color: '#7A91BB' }}>Tap ✕ again to confirm removal</p>
      )}

      {user && group.members.some(m => m.userId === user.id) && !isCreator && (
        <button
          onClick={() => { leaveGroup(group.id, user.id); router.push('/groups'); }}
          className="mx-4 mt-6 rounded-xl py-2.5 text-sm font-semibold transition-colors" style={{ border: '1px solid rgba(255,77,77,0.3)', color: 'rgba(255,77,77,0.7)' }}
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
