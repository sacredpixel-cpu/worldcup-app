'use client';

import { useState, useEffect, useMemo } from 'react';
import { ALL_TEAMS } from '@/data/teams';
import { ROSTERS } from '@/data/rosters';
import { saveTournamentPick, getTournamentPick, subscribeToTournamentSettings } from '@/lib/tournamentService';
import { SCORING } from '@/lib/constants/scoring';

// Golden Boot picks lock at midnight EST on June 18 (after all group stage matches).
// Midnight EST = 05:00 UTC the following day.
const GOLDEN_BOOT_LOCK = '2026-06-19T05:00:00Z';

interface Props {
  userId: string;
}

export function GoldenBootTab({ userId }: Props) {
  const [goldenBootPick, setGoldenBootPick] = useState<string | null>(null);
  const [goldenBootWinner, setGoldenBootWinner] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const isLocked = typeof window !== 'undefined' && new Date() >= new Date(GOLDEN_BOOT_LOCK);

  // Format the deadline in the user's local time
  const deadlineLocal = new Date(GOLDEN_BOOT_LOCK).toLocaleString('en-US', {
    month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short',
  });

  useEffect(() => {
    let cancelled = false;
    getTournamentPick(userId).then(data => {
      if (!cancelled) {
        setGoldenBootPick(data?.goldenBootPick ?? null);
        setLoading(false);
      }
    });
    const unsub = subscribeToTournamentSettings((settings) => {
      if (!cancelled) setGoldenBootWinner(settings.goldenBootWinner ?? null);
    });
    return () => { cancelled = true; unsub(); };
  }, [userId]);

  const allPlayers = useMemo(() => {
    return ALL_TEAMS
      .filter(t => ROSTERS[t.id])
      .flatMap(team =>
        (['forwards', 'midfielders', 'defenders', 'goalkeepers'] as const).flatMap(pos =>
          (ROSTERS[team.id].squad[pos] ?? []).map(name => ({
            name,
            teamName: team.name,
            teamCode: team.code,
          }))
        )
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  const filteredPlayers = search.length >= 2
    ? allPlayers.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.teamName.toLowerCase().includes(search.toLowerCase())
      ).slice(0, 60)
    : [];

  async function selectPlayer(name: string) {
    setGoldenBootPick(name);
    setShowSearch(false);
    setSearch('');
    await saveTournamentPick(userId, { goldenBootPick: name });
  }

  const goldenBootPts = goldenBootWinner !== null
    ? (goldenBootPick === goldenBootWinner ? SCORING.CORRECT_GOLDEN_BOOT : 0)
    : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-5 w-24 animate-pulse rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }} />
      </div>
    );
  }

  return (
    <div className="mt-3 px-4 pb-4 flex flex-col gap-3">

      {/* Golden Boot card */}
      <div className="rounded-xl overflow-hidden" style={{ background: '#0A1128', border: '1px solid rgba(255,255,255,0.07)' }}>

        {/* Header row */}
        <div className="flex items-start justify-between px-4 pt-3 pb-2.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div>
            <h3 className="text-base font-black" style={{ color: '#E8F0FF' }}>🥇 Golden Boot</h3>
            <p className="text-xs mt-0.5" style={{ color: '#9AAED4' }}>Who will be the tournament's top scorer?</p>
          </div>
          {isLocked
            ? <span className="text-xs font-semibold rounded-full px-2.5 py-1 shrink-0" style={{ background: 'rgba(255,255,255,0.05)', color: '#7A91BB', border: '1px solid rgba(255,255,255,0.08)' }}>🔒 Locked</span>
            : <span className="text-xs font-semibold rounded-full px-2.5 py-1 shrink-0" style={{ background: 'rgba(0,196,79,0.1)', color: '#00C44F', border: '1px solid rgba(0,196,79,0.2)' }}>Open</span>
          }
        </div>

        {/* Deadline banner — shown before lock */}
        {!isLocked && (
          <div className="flex items-start gap-2 px-4 py-2.5" style={{ background: 'rgba(255,176,32,0.07)', borderBottom: '1px solid rgba(255,176,32,0.15)' }}>
            <span className="text-base mt-0.5">⏰</span>
            <p className="text-xs leading-relaxed" style={{ color: '#FFB020' }}>
              <span className="font-bold">Your pick locks on June 18 at midnight</span>
              {' '}— after every team gets to play once.
              {' '}<span style={{ color: '#9AAED4' }}>({deadlineLocal} your time)</span>
            </p>
          </div>
        )}

        {/* Expired banner — shown after lock */}
        {isLocked && (
          <div className="flex items-start gap-2 px-4 py-2.5" style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <span className="text-base mt-0.5">🔒</span>
            <p className="text-xs leading-relaxed" style={{ color: '#9AAED4' }}>
              Golden Boot selections <span className="font-semibold" style={{ color: '#C8D8F0' }}>closed June 18 at midnight</span>. No further picks can be made.
            </p>
          </div>
        )}

        {/* Points badge */}
        <div className="flex items-center gap-2 px-4 py-2.5" style={{ background: 'rgba(255,176,32,0.05)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
          <span className="text-sm font-bold" style={{ color: '#FFB020' }}>+{SCORING.CORRECT_GOLDEN_BOOT} pts</span>
          <span className="text-xs" style={{ color: '#9AAED4' }}>for the correct pick · penalty shootout goals don't count</span>
        </div>

        {/* Pick area */}
        <div className="px-4 py-3">
          {goldenBootWinner && (
            <div className="mb-3 rounded-lg px-3 py-2.5" style={{ background: 'rgba(255,176,32,0.1)', border: '1px solid rgba(255,176,32,0.25)' }}>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: '#FFB020' }}>🏆 Tournament Golden Boot</p>
              <p className="text-base font-bold" style={{ color: '#E8F0FF' }}>{goldenBootWinner}</p>
            </div>
          )}

          {goldenBootPick ? (
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: '#9AAED4' }}>Your Pick</p>
                <p className="text-base font-bold truncate" style={{ color: '#E8F0FF' }}>{goldenBootPick}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {goldenBootPts !== null && (
                  <span className="text-sm font-black" style={{
                    fontFamily: 'var(--font-barlow-condensed)',
                    color: goldenBootPts > 0 ? '#FFB020' : '#7A91BB',
                  }}>
                    {goldenBootPts > 0 ? `🌟 +${goldenBootPts} pts` : '✗ 0 pts'}
                  </span>
                )}
                {!isLocked && (
                  <button
                    onClick={() => setShowSearch(true)}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg"
                    style={{ background: 'rgba(255,255,255,0.06)', color: '#9AAED4', border: '1px solid rgba(255,255,255,0.12)' }}
                  >
                    Change
                  </button>
                )}
              </div>
            </div>
          ) : isLocked ? (
            <p className="text-sm text-center py-2" style={{ color: '#7A91BB' }}>No pick was made before the deadline</p>
          ) : (
            <button
              onClick={() => setShowSearch(true)}
              className="w-full rounded-xl py-2.5 text-sm font-semibold"
              style={{ background: 'rgba(255,31,142,0.1)', border: '1px solid rgba(255,31,142,0.3)', color: '#FF4DA8' }}
            >
              + Pick a player
            </button>
          )}

          {showSearch && (
            <div className="mt-3">
              <input
                type="text"
                placeholder="Search by name or country…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                autoFocus
                className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)', color: '#E8F0FF' }}
              />
              {search.length >= 2 ? (
                <div className="mt-1.5 rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)', maxHeight: 220, overflowY: 'auto' }}>
                  {filteredPlayers.length === 0 ? (
                    <p className="px-3 py-3 text-sm text-center" style={{ color: '#7A91BB' }}>No players found</p>
                  ) : filteredPlayers.map(p => (
                    <button
                      key={`${p.name}-${p.teamCode}`}
                      onClick={() => selectPlayer(p.name)}
                      className="w-full flex items-center justify-between px-3 py-2.5 text-left"
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: goldenBootPick === p.name ? 'rgba(255,176,32,0.08)' : 'transparent' }}
                    >
                      <span className="text-sm font-semibold" style={{ color: goldenBootPick === p.name ? '#FFB020' : '#E8F0FF' }}>{p.name}</span>
                      <span className="text-xs shrink-0 ml-2" style={{ color: '#9AAED4' }}>{p.teamName}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-sm text-center" style={{ color: '#7A91BB' }}>Type 2+ characters to search</p>
              )}
              <button
                onClick={() => { setShowSearch(false); setSearch(''); }}
                className="w-full mt-2 py-1.5 text-sm rounded-lg"
                style={{ color: '#7A91BB' }}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Info note */}
      <div className="rounded-xl px-4 py-3.5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <p className="text-sm font-semibold mb-1.5" style={{ color: '#C8D8F0' }}>How the Golden Boot works</p>
        <p className="text-xs leading-relaxed" style={{ color: '#9AAED4' }}>
          The player with the most goals across all tournament matches wins the Golden Boot.
          Goals scored in penalty shootouts are not counted — only goals in regular and extra time.
          Your pick locks on <span className="font-semibold" style={{ color: '#C8D8F0' }}>June 18 at midnight</span> — after every team gets to play once — then selections are locked for the rest of the tournament.
        </p>
      </div>

    </div>
  );
}
