'use client';

import { useAuthStore, usePredictionsStore, useGroupsStore } from '@/store';
import { ClientOnly } from '@/components/ui/ClientOnly';
import { ALL_MATCHES } from '@/data/matches';
import { calcPoints } from '@/lib/utils/calcPoints';
import { calcGroupPoints } from '@/lib/utils/calcGroupPoints';
import { useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { uploadAvatar } from '@/lib/uploadService';
import { COUNTRIES, US_STATES } from '@/data/countries';

function ProfileContent() {
  const { user, clearAuth, updateAvatar, updateLocation } = useAuthStore();
  const { saved } = usePredictionsStore();
  const { groups } = useGroupsStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

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
    // Add group-advancement prediction points (+3 winner, +2 runner-up, +1 third)
    pts += calcGroupPoints(saved).total;
    const totalPredictions = preds.length;
    const accuracy = totalPredictions > 0 ? Math.round((correct / Math.max(finished.length, 1)) * 100) : 0;
    return { pts, exact, correct, totalPredictions, accuracy };
  }, [user, saved]);

  const myGroups = groups.filter(g => user && g.members.some(m => m.userId === user.id));

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    try {
      const url = await uploadAvatar(user.id, file);
      updateAvatar(url);
    } catch (err) {
      console.error('Upload failed', err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
        <div className="mb-4 text-5xl">👤</div>
        <h2 className="mb-2 text-xl font-bold" style={{ color: '#E8F0FF' }}>Your Profile</h2>
        <p className="mb-6 text-sm" style={{ color: '#7A91BB' }}>Sign in to track your stats and compete with friends</p>
        <div className="flex flex-col gap-3 w-full">
          <Link href="/auth/register" className="block w-full rounded-xl bg-brand py-3.5 text-center text-sm font-semibold" style={{ color: '#06091A' }}>
            Create Account
          </Link>
          <Link href="/auth/login" className="block w-full rounded-xl py-3.5 text-center text-sm font-semibold" style={{ border: '1px solid rgba(255,255,255,0.12)', color: '#E8F0FF' }}>
            Sign In
          </Link>
        </div>
        <div className="mt-12 flex flex-col items-center gap-2">
          <Image
            src="/mexillicious-logo.png"
            alt="Mexillicious"
            width={100}
            height={40}
            className="object-contain opacity-80"
            unoptimized
          />
          <p className="text-[10px] tracking-wide" style={{ color: '#7A91BB' }}>Mexillicious™ LLC 2026</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col pb-4">
      {/* Avatar + name */}
      <div className="flex flex-col items-center px-4 pt-6 pb-4">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="relative mb-3 group"
          disabled={uploading}
        >
          {user.avatarUrl ? (
            <Image
              src={user.avatarUrl}
              alt={user.displayName}
              width={80} height={80}
              className="rounded-full object-cover"
              unoptimized
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand text-3xl font-black text-gray-900">
              {user.displayName[0].toUpperCase()}
            </div>
          )}

          {/* Overlay */}
          <div className={`absolute inset-0 flex flex-col items-center justify-center rounded-full bg-black/50 transition-opacity ${uploading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
            {uploading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <>
                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-[10px] text-white mt-0.5">Edit</span>
              </>
            )}
          </div>
        </button>

        {/* Hidden file input — shows camera + library on mobile */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleAvatarChange}
        />

        <h1 className="text-xl font-black" style={{ color: '#E8F0FF' }}>{user.displayName}</h1>
        <p className="text-sm" style={{ color: '#7A91BB' }}>{user.email}</p>
        <p className="mt-1 text-xs" style={{ color: '#5A6E94' }}>Tap photo to change</p>
      </div>

      {/* Stats grid */}
      {stats && (
        <div className="mx-4 mb-4 grid grid-cols-2 gap-3">
          {[
            { label: 'Total Points', value: stats.pts, color: '#FFB020' },
            { label: 'Predictions', value: stats.totalPredictions, color: '#E8F0FF' },
            { label: 'Exact Scores', value: stats.exact, color: '#FF4DA8' },
            { label: 'Accuracy', value: `${stats.accuracy}%`, color: '#E8F0FF' },
          ].map(s => (
            <div key={s.label} className="rounded-xl p-4 text-center" style={{ background: '#0E1535', border: '1px solid rgba(255,255,255,0.07)' }}>
              <p className="text-2xl font-black" style={{ color: s.color, fontFamily: 'var(--font-barlow-condensed)' }}>{s.value}</p>
              <p className="text-xs mt-1" style={{ color: '#7A91BB' }}>{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* My Groups */}
      {myGroups.length > 0 && (
        <div className="mx-4 mb-4">
          <h2 className="mb-2 text-xs font-bold uppercase tracking-widest" style={{ color: '#5A6E94' }}>My Groups</h2>
          <div className="flex flex-col gap-2">
            {myGroups.map(g => (
              <Link key={g.id} href={`/groups/${g.id}`}
                className="flex items-center justify-between rounded-xl px-4 py-3" style={{ background: '#0E1535', border: '1px solid rgba(255,255,255,0.07)' }}>
                <span className="text-sm font-semibold" style={{ color: '#E8F0FF' }}>{g.name}</span>
                <span className="text-xs" style={{ color: '#7A91BB' }}>{g.members.length} members →</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Location */}
      <div className="mx-4 mb-4 rounded-xl p-4" style={{ background: '#0E1535', border: '1px solid rgba(255,255,255,0.07)' }}>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-widest" style={{ color: '#5A6E94' }}>Where are you from?</h2>
        <div className="flex flex-col gap-3">
          <div className="relative">
            <select
              value={user.countryCode ?? ''}
              onChange={e => {
                const c = COUNTRIES.find(c => c.code === e.target.value);
                if (c) updateLocation(c.name, c.code, c.code === 'us' ? user.state : undefined);
              }}
              className="w-full appearance-none rounded-lg px-3 py-2.5 text-sm pr-8 focus:outline-none"
              style={{ border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#E8F0FF' }}
            >
              <option value="" style={{ background: '#0E1535' }}>Select country…</option>
              {COUNTRIES.map(c => (
                <option key={c.code} value={c.code} style={{ background: '#0E1535' }}>{c.name}</option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#7A91BB' }}>▾</span>
          </div>

          {user.countryCode === 'us' && (
            <div className="relative">
              <select
                value={user.state ?? ''}
                onChange={e => updateLocation('USA', 'us', e.target.value)}
                className="w-full appearance-none rounded-lg px-3 py-2.5 text-sm pr-8 focus:outline-none"
                style={{ border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#E8F0FF' }}
              >
                <option value="" style={{ background: '#0E1535' }}>Select state…</option>
                {US_STATES.map(s => (
                  <option key={s} value={s} style={{ background: '#0E1535' }}>{s}</option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#7A91BB' }}>▾</span>
            </div>
          )}

          {user.countryCode && (
            <div className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ background: 'rgba(255,255,255,0.04)' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`https://flagcdn.com/w40/${user.countryCode}.png`} alt="" className="h-4 w-6 object-cover rounded-sm" />
              <span className="text-sm" style={{ color: '#C8D0E0' }}>
                {user.country}{user.state ? `, ${user.state}` : ''}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Scoring Rules */}
      <div className="mx-4 mb-4 rounded-xl overflow-hidden" style={{ background: '#0E1535', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="px-4 pt-4 pb-3">
          <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: '#5A6E94' }}>How Points Are Scored</h2>
        </div>

        {/* Score Predictions */}
        <div className="px-4 pb-1">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest" style={{ color: '#FF4DA8' }}>Score Predictions</p>
          {[
            { pts: '+10', desc: 'Both scores exact (perfect)',    note: '5 + 5 pts'         },
            { pts: '+5',  desc: 'One score exact',               note: 'per correct team'  },
            { pts: '+3',  desc: 'Correct outcome (W / D / L)',   note: 'if no exact score' },
          ].map(r => (
            <div key={r.desc} className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="flex-1 min-w-0">
                <span className="text-sm" style={{ color: '#C8D0E0' }}>{r.desc}</span>
                <span className="ml-1.5 text-[10px]" style={{ color: '#5A6E94' }}>{r.note}</span>
              </div>
              <span className="ml-3 text-sm font-black shrink-0" style={{ color: '#FFB020', fontFamily: 'var(--font-barlow-condensed)' }}>{r.pts}</span>
            </div>
          ))}
        </div>

        {/* Scorer Picks */}
        <div className="px-4 pt-3 pb-1">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest" style={{ color: '#FF4DA8' }}>Scorer Picks</p>
          {[
            { pts: '+1', desc: 'Player you picked scores',      color: '#00C44F' },
            { pts: '−1', desc: "Player you picked doesn't score", color: '#FF4D4D' },
          ].map(r => (
            <div key={r.desc} className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <span className="text-sm" style={{ color: '#C8D0E0' }}>{r.desc}</span>
              <span className="ml-3 text-sm font-black shrink-0" style={{ color: r.color, fontFamily: 'var(--font-barlow-condensed)' }}>{r.pts}</span>
            </div>
          ))}
        </div>

        {/* Group Stage */}
        <div className="px-4 pt-3 pb-1">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest" style={{ color: '#FF4DA8' }}>Group Stage Standings</p>
          {[
            { pts: '+3', desc: 'Group winner correct'    },
            { pts: '+2', desc: 'Runner-up correct'       },
            { pts: '+1', desc: '3rd place correct'       },
          ].map(r => (
            <div key={r.desc} className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <span className="text-sm" style={{ color: '#C8D0E0' }}>{r.desc}</span>
              <span className="ml-3 text-sm font-black shrink-0" style={{ color: '#FFB020', fontFamily: 'var(--font-barlow-condensed)' }}>{r.pts}</span>
            </div>
          ))}
        </div>

        {/* Knockouts */}
        <div className="px-4 pt-3 pb-4">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest" style={{ color: '#FF4DA8' }}>Knockout Stage</p>
          {[
            { pts: '+4',  desc: 'Correct finalist'  },
            { pts: '+10', desc: 'Correct champion'   },
          ].map(r => (
            <div key={r.desc} className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <span className="text-sm" style={{ color: '#C8D0E0' }}>{r.desc}</span>
              <span className="ml-3 text-sm font-black shrink-0" style={{ color: '#FFB020', fontFamily: 'var(--font-barlow-condensed)' }}>{r.pts}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Sign out */}
      <button
        onClick={clearAuth}
        className="mx-4 rounded-xl py-3 text-sm font-semibold transition-colors"
        style={{ border: '1px solid rgba(0,196,79,0.25)', color: 'rgba(0,196,79,0.7)' }}
      >
        Sign Out
      </button>

      {/* Mexillicious branding footer */}
      <div className="mt-8 mb-2 flex flex-col items-center gap-2 px-4">
        <Image
          src="/mexillicious-logo.png"
          alt="Mexillicious"
          width={100}
          height={40}
          className="object-contain opacity-80"
          unoptimized
        />
        <p className="text-[10px] tracking-wide" style={{ color: '#7A91BB' }}>Mexillicious™ LLC 2026</p>
      </div>
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
