'use client';

import { useState, useEffect, useMemo } from 'react';
import { ALL_TEAMS } from '@/data/teams';
import { ROSTERS } from '@/data/rosters';
import { saveTournamentPick, getTournamentPick, subscribeToTournamentSettings } from '@/lib/tournamentService';
import { SCORING } from '@/lib/constants/scoring';

const TOURNAMENT_STARTS = '2026-06-11T00:00:00Z';

interface Props {
  userId: string;
}

export function GoldenBootTab({ userId }: Props) {
  const [goldenBootPick, setGoldenBootPick] = useState<string | null>(null);
  const [goldenBootWinner, setGoldenBootWinner] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const isLocked = typeof window !== 'undefined' && new Date() >= new Date(TOURNAMENT_STARTS);

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
            <h3 className="text-sm font-black" style={{ color: '#E8F0FF' }}>🥇 Golden Boot</h3>
            <p className="text-[10px] mt-0.5" style={{ color: '#7A91BB' }}>Who will be the tournament's top scorer?</p>
          </div>
          {isLocked
            ? <span className="text-[10px] font-semibold rounded-full px-2.5 py-1 shrink-0" style={{ background: 'rgba(255,255,255,0.05)', color: '#5A6E94', border: '1px solid rgba(255,255,255,0.08)' }}>🔒 Locked</span>
            : <span className="text-[10px] font-semibold rounded-full px-2.5 py-1 shrink-0" style={{ background: 'rgba(0,196,79,0.1)', color: '#00C44F', border: '1px solid rgba(0,196,79,0.2)' }}>Open</span>
          }
        </div>

        {/* Points badge */}
        <div className="flex items-center gap-2 px-4 py-2" style={{ background: 'rgba(255,176,32,0.05)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
          <span className="text-[11px] font-bold" style={{ color: '#FFB020' }}>+{SCORING.CORRECT_GOLDEN_BOOT} pts</span>
          <span className="text-[11px]" style={{ color: '#5A6E94' }}>for the correct pick · penalty shootout goals don't count</span>
        </div>

        {/* Pick area */}
        <div className="px-4 py-3">
          {goldenBootWinner && (
            <div className="mb-3 rounded-lg px-3 py-2" style={{ background: 'rgba(255,176,32,0.1)', border: '1px solid rgba(255,176,32,0.25)' }}>
              <p className="text-[9px] font-bold uppercase tracking-widest mb-0.5" style={{ color: '#FFB020' }}>🏆 Tournament Golden Boot</p>
              <p className="text-sm font-bold" style={{ color: '#E8F0FF' }}>{goldenBootWinner}</p>
            </div>
          )}

          {goldenBootPick ? (
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[9px] font-bold uppercase tracking-widest mb-0.5" style={{ color: '#7A91BB' }}>Your Pick</p>
                <p className="text-sm font-bold truncate" style={{ color: '#E8F0FF' }}>{goldenBootPick}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {goldenBootPts !== null && (
                  <span className="text-sm font-black" style={{
                    fontFamily: 'var(--font-barlow-condensed)',
                    color: goldenBootPts > 0 ? '#FFB020' : '#5A6E94',
                  }}>
                    {goldenBootPts > 0 ? `🌟 +${goldenBootPts} pts` : '✗ 0 pts'}
                  </span>
                )}
                {!isLocked && (
                  <button
                    onClick={() => setShowSearch(true)}
                    className="text-[11px] font-semibold px-2.5 py-1 rounded-lg"
                    style={{ background: 'rgba(255,255,255,0.06)', color: '#7A91BB', border: '1px solid rgba(255,255,255,0.1)' }}
                  >
                    Change
                  </button>
                )}
              </div>
            </div>
          ) : isLocked ? (
            <p className="text-sm text-center py-2" style={{ color: '#5A6E94' }}>No pick was made before the tournament started</p>
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
                    <p className="px-3 py-3 text-xs text-center" style={{ color: '#5A6E94' }}>No players found</p>
                  ) : filteredPlayers.map(p => (
                    <button
                      key={`${p.name}-${p.teamCode}`}
                      onClick={() => selectPlayer(p.name)}
                      className="w-full flex items-center justify-between px-3 py-2 text-left"
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: goldenBootPick === p.name ? 'rgba(255,176,32,0.08)' : 'transparent' }}
                    >
                      <span className="text-sm font-semibold" style={{ color: goldenBootPick === p.name ? '#FFB020' : '#E8F0FF' }}>{p.name}</span>
                      <span className="text-[10px] shrink-0 ml-2" style={{ color: '#5A6E94' }}>{p.teamName}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-xs text-center" style={{ color: '#5A6E94' }}>Type 2+ characters to search</p>
              )}
              <button
                onClick={() => { setShowSearch(false); setSearch(''); }}
                className="w-full mt-2 py-1.5 text-xs rounded-lg"
                style={{ color: '#5A6E94' }}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Info note */}
      <div className="rounded-xl px-4 py-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <p className="text-xs font-semibold mb-1" style={{ color: '#7A91BB' }}>How the Golden Boot works</p>
        <p className="text-[11px] leading-relaxed" style={{ color: '#5A6E94' }}>
          The player with the most goals across all tournament matches wins the Golden Boot.
          Goals scored in penalty shootouts are not counted — only goals in regular and extra time.
          Picks lock when the tournament begins on June 11.
        </p>
      </div>

    </div>
  );
}
