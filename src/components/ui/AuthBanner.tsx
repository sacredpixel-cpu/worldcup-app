'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';
import { useAuthStore } from '@/store';
import { usePredictionsStore } from '@/store/slices/predictionsSlice';
import { useMatchesStore } from '@/store/slices/matchesSlice';
import { ALL_MATCHES } from '@/data/matches';
import { calcPoints } from '@/lib/utils/calcPoints';
import { ClientOnly } from './ClientOnly';
import Image from 'next/image';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';

function BannerInner() {
  const { user, clearAuth } = useAuthStore();
  const { saved } = usePredictionsStore();
  const { getLiveMatch, updates } = useMatchesStore();
  const pathname = usePathname();

  // Dynamically compute total pts from finished matches — same logic as the leaderboard.
  // This stays live as Firestore updates arrive (goal scorers, etc.).
  const totalPts = useMemo(() => {
    if (!user) return 0;
    const finished = ALL_MATCHES
      .map(getLiveMatch)
      .filter(m => m.status === 'finished' && m.homeScore !== null);
    return finished.reduce((sum, m) => {
      const p = saved[m.id];
      if (!p) return sum;
      return sum + calcPoints(p, {
        homeScore: m.homeScore!,
        awayScore: m.awayScore!,
        homeScorers: m.homeScorers,
        awayScorers: m.awayScorers,
      });
    }, 0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, saved, updates]);

  if (pathname.startsWith('/auth')) return null;

  const bannerStyle = {
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    background: 'rgba(255,255,255,0.02)',
  };

  if (!user) {
    return (
      <div className="sticky top-0 z-40 flex items-center justify-between gap-2 px-4 py-2.5 backdrop-blur" style={bannerStyle}>
        <span className="text-[12px]" style={{ color: '#7A91BB' }}>Sign in to submit predictions</span>
        <div className="flex items-center gap-2">
          <Link
            href={`/auth/login?from=${encodeURIComponent(pathname)}`}
            className="rounded-full px-3 py-1 text-[12px] font-bold"
            style={{ background: 'rgba(255,255,255,0.06)', color: '#C8D0E0', border: '1px solid rgba(255,255,255,0.09)' }}
          >
            Log in
          </Link>
          <Link
            href={`/auth/register?from=${encodeURIComponent(pathname)}`}
            className="rounded-full px-3 py-1 text-[12px] font-bold"
            style={{ background: '#FF1F8E', color: '#06091A' }}
          >
            Sign up
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="sticky top-0 z-40 flex items-center justify-between gap-2 px-4 py-2 backdrop-blur" style={bannerStyle}>
      <div className="flex items-center gap-2">
        {user.avatarUrl ? (
          <Image src={user.avatarUrl} alt={user.displayName} width={28} height={28} className="rounded-full object-cover" unoptimized />
        ) : (
          <div className="flex h-7 w-7 items-center justify-center rounded-full text-[12px] font-black text-white" style={{ background: 'linear-gradient(135deg,#FF1F8E,#C0106A)' }}>
            {user.displayName[0].toUpperCase()}
          </div>
        )}
        <span className="text-[12px] font-semibold" style={{ color: '#C8D0E0' }}>{user.displayName}</span>
        <span className="text-[12px] font-bold" style={{ color: '#FFB020' }}>{totalPts} pts</span>
      </div>
      <button
        onClick={() => { signOut(auth).catch(console.error); clearAuth(); }}
        className="rounded-full px-3 py-1 text-[11px] font-semibold"
        style={{ color: '#7A91BB', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        Sign out
      </button>
    </div>
  );
}

export function AuthBanner() {
  return (
    <ClientOnly fallback={
      <div className="sticky top-0 z-40 h-[42px]" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }} />
    }>
      <BannerInner />
    </ClientOnly>
  );
}
