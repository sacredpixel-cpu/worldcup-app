'use client';

import { useAuthStore, usePredictionsStore, useGroupsStore } from '@/store';
import { useMatchesStore } from '@/store/slices/matchesSlice';
import { ClientOnly } from '@/components/ui/ClientOnly';
import { ALL_MATCHES } from '@/data/matches';
import { calcPoints } from '@/lib/utils/calcPoints';
import { calcGroupPoints } from '@/lib/utils/calcGroupPoints';
import { useMemo, useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { uploadAvatar } from '@/lib/uploadService';
import { COUNTRIES, US_STATES } from '@/data/countries';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { requestAndSaveToken, diagnoseNotifications, getLastTokenError, isNotificationSupported, needsPWAInstall } from '@/lib/notifications';

function ProfileContent() {
  const { user, clearAuth, updateAvatar, updateLocation } = useAuthStore();
  const { saved } = usePredictionsStore();
  const { groups } = useGroupsStore();
  const { getLiveMatch, updates } = useMatchesStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  type NotifStatus = 'loading' | 'unsupported' | 'pwa-required' | 'default' | 'granted' | 'denied';
  const [notifStatus, setNotifStatus] = useState<NotifStatus>('loading');
  const [enabling, setEnabling] = useState(false);
  const [synced, setSynced] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  useEffect(() => {
    if (!isNotificationSupported()) { setNotifStatus('unsupported'); return; }
    if (needsPWAInstall())          { setNotifStatus('pwa-required'); return; }
    setNotifStatus(Notification.permission as 'default' | 'granted' | 'denied');
  }, []);

  async function handleEnableNotifications() {
    if (!user) return;
    setEnabling(true);
    setSynced(false);
    setSyncError(null);
    try {
      const diagProblem = await diagnoseNotifications();
      if (diagProblem) { setSyncError(diagProblem); return; }
      const token = await requestAndSaveToken(user.id);
      setNotifStatus(Notification.permission as 'default' | 'granted' | 'denied');
      if (token) {
        setSynced(true);
      } else {
        setSyncError(getLastTokenError() ?? 'getToken returned null — VAPID key may not match Firebase push certificate');
      }
    } finally {
      setEnabling(false);
    }
  }

  async function handleTestNotification() {
    try {
      const reg = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');
      if (!reg) { alert('Service worker not registered. Try Re-sync first.'); return; }
      await reg.showNotification('⚽ Test — World Cup 2026', {
        body: 'Notifications are working on this device!',
        icon: '/mexillicious-logo.png',
        badge: '/mexillicious-logo.png',
        tag: 'wc2026-test',
      });
    } catch (e) {
      alert('Could not show test notification: ' + String(e));
    }
  }

  const stats = useMemo(() => {
    if (!user) return null;
    const preds = Object.values(saved);
    const finished = ALL_MATCHES.map(getLiveMatch).filter(m => m.status === 'finished' && m.homeScore !== null);
    let pts = 0, exact = 0, correct = 0;
    finished.forEach(m => {
      const p = saved[m.id];
      if (!p) return;
      const earned = calcPoints(p, {
        homeScore: m.homeScore!,
        awayScore: m.awayScore!,
        homeScorers: m.homeScorers,
        awayScorers: m.awayScorers,
      });
      pts += earned;
      if (p.homeScore === m.homeScore && p.awayScore === m.awayScore) exact++;
      if (earned > 0) correct++;
    });
    pts += calcGroupPoints(saved, updates).total;
    const totalPredictions = preds.length;
    const accuracy = totalPredictions > 0 ? Math.round((correct / Math.max(finished.length, 1)) * 100) : 0;
    return { pts, exact, correct, totalPredictions, accuracy };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, saved, updates]);

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

      {/* Partner logos + social */}
      <div className="mx-4 mb-4" style={{ display: 'flex', justifyContent: 'center', gap: 32 }}>

        {/* Mexillicious */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <Image src="/mexillicious-logo.png" alt="Mexillicious" width={72} height={72} style={{ objectFit: 'contain', opacity: 0.85 }} unoptimized />
          <div style={{ display: 'flex', gap: 12 }}>
            <a href="https://tiktok.com/@mexillicious" target="_blank" rel="noopener noreferrer" style={{ color: '#778DA9', display: 'flex', alignItems: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.23 8.23 0 004.84 1.55V6.79a4.85 4.85 0 01-1.07-.1z"/></svg>
            </a>
            <a href="https://instagram.com/mexillicious" target="_blank" rel="noopener noreferrer" style={{ color: '#778DA9', display: 'flex', alignItems: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
            </a>
          </div>
        </div>

        {/* InchaStudios */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 8, fontWeight: 900, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#778DA9', border: '1px solid rgba(119,141,169,0.35)', borderRadius: 4, padding: '2px 6px' }}>PARTNER</span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/inchalogo.png" alt="InchaStudios" style={{ width: 58, height: 50, objectFit: 'contain', filter: 'invert(1) brightness(0.75)' }} />
          <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
            <a href="https://tiktok.com/@inchastudios" target="_blank" rel="noopener noreferrer" style={{ color: '#778DA9', display: 'flex', alignItems: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.23 8.23 0 004.84 1.55V6.79a4.85 4.85 0 01-1.07-.1z"/></svg>
            </a>
            <a href="https://instagram.com/@inchastudios" target="_blank" rel="noopener noreferrer" style={{ color: '#778DA9', display: 'flex', alignItems: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
            </a>
          </div>
        </div>

      </div>

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

      {/* Notifications */}
      {notifStatus !== 'loading' && notifStatus !== 'unsupported' && (
        <div className="mx-4 mb-4 rounded-xl px-4 py-3.5" style={{ background: '#0E1535', border: '1px solid rgba(255,255,255,0.07)' }}>
          <h2 className="mb-3 text-xs font-bold uppercase tracking-widest" style={{ color: '#5A6E94' }}>Notifications</h2>
          <div className="flex items-center gap-3">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
              style={{ background: notifStatus === 'granted' ? 'rgba(0,196,79,0.12)' : 'rgba(255,255,255,0.06)', border: `1px solid ${notifStatus === 'granted' ? 'rgba(0,196,79,0.25)' : 'rgba(255,255,255,0.08)'}` }}
            >
              <span className="text-base">{notifStatus === 'granted' ? '🔔' : '🔕'}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold" style={{ color: '#E8F0FF' }}>Match Alerts</p>
              <p className="text-xs" style={{ color: '#7A91BB' }}>
                {notifStatus === 'granted' && synced  ? 'Enabled and synced ✓' :
                 notifStatus === 'granted'            ? 'Enabled — tap Re-sync to refresh token' :
                 notifStatus === 'denied'             ? 'Blocked — enable in browser Settings' :
                 notifStatus === 'pwa-required'       ? 'Add to Home Screen first (iOS)' :
                 'Get notified for goals, kickoffs & results'}
              </p>
            </div>
            {(notifStatus === 'default' || notifStatus === 'granted') && (
              <button
                onClick={handleEnableNotifications}
                disabled={enabling || synced}
                className="shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition-opacity active:opacity-70"
                style={notifStatus === 'granted'
                  ? { background: synced ? 'rgba(0,196,79,0.15)' : 'rgba(255,255,255,0.08)', color: synced ? '#00C44F' : '#C8D8F0', border: '1px solid rgba(255,255,255,0.1)' }
                  : { background: '#FF1F8E', color: '#06091A' }}
              >
                {enabling ? '…' : notifStatus === 'granted' ? (synced ? 'Synced ✓' : 'Re-sync') : 'Enable'}
              </button>
            )}
          </div>
          {notifStatus === 'granted' && synced && (
            <button
              onClick={handleTestNotification}
              className="mt-2.5 w-full rounded-lg py-2 text-xs font-semibold text-center transition-opacity active:opacity-70"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: '#7A91BB' }}
            >
              Send test notification
            </button>
          )}
          {syncError && (
            <p className="mt-2 text-xs leading-snug" style={{ color: '#FF6B6B' }}>⚠ {syncError}</p>
          )}
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
            { pts: '+6',  desc: 'Both scores exact (perfect)',    note: '3 + 3 pts'         },
            { pts: '+3',  desc: 'One score exact',               note: 'per correct team'  },
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
            { pts: '+2', desc: 'Player you picked scores',      color: '#00C44F' },
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
        onClick={() => { signOut(auth).catch(console.error); clearAuth(); }}
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
