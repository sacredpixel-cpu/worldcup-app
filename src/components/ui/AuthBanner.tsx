'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store';
import { ClientOnly } from './ClientOnly';
import Image from 'next/image';

function BannerInner() {
  const { user, clearAuth } = useAuthStore();
  const pathname = usePathname();

  const isAuthPage = pathname.startsWith('/auth');
  if (isAuthPage) return null;

  if (!user) {
    return (
      <div className="sticky top-0 z-40 flex items-center justify-between gap-2 border-b border-border bg-surface/95 px-4 py-2.5 backdrop-blur">
        <div className="flex items-center gap-2">
          <span className="text-2xl">⚽</span>
          <div>
            <p className="text-sm font-bold text-white">World Cup 2026</p>
            <p className="text-xs text-white/50">Sign in to predict scores</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/auth/login?from=${encodeURIComponent(pathname)}`}
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-white hover:bg-card"
          >
            Log In
          </Link>
          <Link
            href={`/auth/register?from=${encodeURIComponent(pathname)}`}
            className="rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-light"
          >
            Sign Up
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-surface/95 px-4 py-2 backdrop-blur">
      <div className="flex items-center gap-2.5">
        {user.avatarUrl ? (
          <Image src={user.avatarUrl} alt={user.displayName} width={32} height={32} className="rounded-full" unoptimized />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">
            {user.displayName[0].toUpperCase()}
          </div>
        )}
        <div>
          <p className="text-sm font-semibold text-white">{user.displayName}</p>
          <p className="text-xs text-gold">{user.totalPoints} pts</p>
        </div>
      </div>
      <button
        onClick={clearAuth}
        className="rounded-lg border border-border px-3 py-1.5 text-xs text-white/50 hover:text-white"
      >
        Sign Out
      </button>
    </div>
  );
}

export function AuthBanner() {
  return (
    <ClientOnly fallback={
      <div className="sticky top-0 z-40 h-[52px] border-b border-border bg-surface" />
    }>
      <BannerInner />
    </ClientOnly>
  );
}
