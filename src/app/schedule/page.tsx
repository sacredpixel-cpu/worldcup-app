'use client';

import { useMemo, useState, useEffect } from 'react';
import { useAuthStore, usePredictionsStore } from '@/store';
import { ALL_MATCHES, GROUP_STAGE_MATCHES, KNOCKOUT_MATCHES, STAGE_LABELS } from '@/data/matches';
import { GROUPS } from '@/data/teams';
import { MatchCard } from '@/components/schedule/MatchCard';
import { DayFilter } from '@/components/schedule/DayFilter';
import { GroupStageTable } from '@/components/schedule/GroupStageTable';
import { ClientOnly } from '@/components/ui/ClientOnly';
import { BracketView } from '@/components/bracket/BracketView';
import { subscribeToUserProfiles } from '@/lib/usersService';
import type { Match } from '@/types/match';

type Tab = 'all' | 'groups' | 'knockout' | 'bracket';

function getDateStr(iso: string) {
  return iso.slice(0, 10);
}

function uniqueDates(matches: Match[]) {
  const seen = new Set<string>();
  return [...matches]
    .sort((a, b) => a.kickoffAt.localeCompare(b.kickoffAt))
    .map(m => getDateStr(m.kickoffAt))
    .filter(d => { if (seen.has(d)) return false; seen.add(d); return true; });
}

function buildStandings(groupLetter: string, matches: Match[]) {
  const teams = GROUPS[groupLetter] ?? [];
  const standings = teams.map(team => ({ team, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, pts: 0 }));
  const byId = Object.fromEntries(standings.map(s => [s.team.id, s]));

  matches
    .filter(m => m.stage === 'group' && m.status === 'finished' && m.homeScore !== null)
    .forEach(m => {
      const home = byId[m.homeTeam.id];
      const away = byId[m.awayTeam.id];
      if (!home || !away) return;
      home.played++; away.played++;
      home.gf += m.homeScore!; home.ga += m.awayScore!;
      away.gf += m.awayScore!; away.ga += m.homeScore!;
      if (m.homeScore! > m.awayScore!) { home.won++; home.pts += 3; away.lost++; }
      else if (m.homeScore! < m.awayScore!) { away.won++; away.pts += 3; home.lost++; }
      else { home.drawn++; home.pts++; away.drawn++; away.pts++; }
    });

  return standings;
}

const KNOCKOUT_STAGES: Match['stage'][] = ['round-of-32', 'round-of-16', 'quarter-final', 'semi-final', 'third-place', 'final'];

function ScheduleContent() {
  const { user } = useAuthStore();
  const { saved } = usePredictionsStore();
  const allSaved = Object.values(saved);

  const [tab, setTab] = useState<Tab>('all');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<string>('A');
  const [groupView, setGroupView] = useState<'matches' | 'table'>('matches');
  const [fanCount, setFanCount] = useState<number | null>(null);

  useEffect(() => {
    const unsub = subscribeToUserProfiles(profiles => setFanCount(Object.keys(profiles).length));
    return () => unsub();
  }, []);

  const allDates = useMemo(() => uniqueDates(ALL_MATCHES), []);

  const filteredAll = useMemo(() => {
    const sorted = [...ALL_MATCHES].sort((a, b) => a.kickoffAt.localeCompare(b.kickoffAt));
    if (!selectedDate) return sorted;
    return sorted.filter(m => getDateStr(m.kickoffAt) === selectedDate);
  }, [selectedDate]);

  const groupMatches = useMemo(() =>
    [...GROUP_STAGE_MATCHES]
      .filter(m => m.homeTeam.group === selectedGroup)
      .sort((a, b) => a.kickoffAt.localeCompare(b.kickoffAt)),
    [selectedGroup]
  );

  const groupStandings = useMemo(() => buildStandings(selectedGroup, groupMatches), [selectedGroup, groupMatches]);

  const tabs: { id: Tab; label: string }[] = [
    { id: 'all', label: 'All Matches' },
    { id: 'groups', label: 'Group Stage' },
    { id: 'knockout', label: 'Knockout' },
    { id: 'bracket', label: 'Bracket' },
  ];

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center gap-3">
          <h1 style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#E8F0FF', fontSize: '44px', fontWeight: 900, letterSpacing: '0.02em', lineHeight: 1 }}>
            2026 WORLD CUP
          </h1>
          <div className="flex flex-col" style={{ gap: '3px' }}>
            {['SCHEDULE', 'BRACKETS', 'PREDICTIONS'].map(word => (
              <span
                key={word}
                style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#E8F0FF', fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', lineHeight: 1 }}
              >
                {word}
              </span>
            ))}
          </div>
        </div>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-xs" style={{ color: '#7A91BB' }}>Jun 11 – Jul 19 · USA · Canada · Mexico</span>
          {fanCount !== null && (
            <>
              <span style={{ color: '#3A4E6E' }}>·</span>
              <span className="text-xs" style={{ color: '#7A91BB' }}>
                ⚽ <span className="font-semibold" style={{ color: '#FFB020' }}>{fanCount.toLocaleString()}</span> fans
              </span>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="no-scrollbar flex gap-1 overflow-x-auto px-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="flex-shrink-0 px-3 py-2.5 text-sm font-semibold transition-colors"
            style={tab === t.id
              ? { borderBottom: '2px solid #FF4DA8', color: '#FF4DA8' }
              : { borderBottom: '2px solid transparent', color: '#7A91BB' }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* All Matches tab */}
      {tab === 'all' && (
        <>
          <DayFilter dates={allDates} selected={selectedDate} onChange={setSelectedDate} />
          <div className="flex flex-col gap-3 px-4 pb-4">
            {filteredAll.map(match => (
              <MatchCard
                key={match.id}
                match={match}
                userPrediction={saved[match.id]}
                allUserPredictions={allSaved}
                isAuthenticated={!!user}
                userId={user?.id}
              />
            ))}
            {filteredAll.length === 0 && (
              <p className="py-8 text-center text-sm" style={{ color: '#7A91BB' }}>No matches on this date</p>
            )}
          </div>
        </>
      )}

      {/* Group Stage tab */}
      {tab === 'groups' && (
        <div className="flex flex-col gap-3">
          {/* Group selector */}
          <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 pt-3">
            {Object.keys(GROUPS).map(g => (
              <button
                key={g}
                onClick={() => setSelectedGroup(g)}
                className="flex-shrink-0 h-9 w-9 rounded-full text-sm font-bold transition-colors"
                style={selectedGroup === g
                  ? { background: '#FF1F8E', color: '#06091A' }
                  : { background: 'rgba(255,255,255,0.05)', color: '#7A91BB', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                {g}
              </button>
            ))}
          </div>

          {/* Matches / Table toggle */}
          <div className="flex gap-2 px-4">
            {(['matches', 'table'] as const).map(v => (
              <button
                key={v}
                onClick={() => setGroupView(v)}
                className="rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-colors"
                style={groupView === v
                  ? { background: '#FF1F8E', color: '#06091A' }
                  : { background: 'rgba(255,255,255,0.05)', color: '#7A91BB' }}
              >
                {v === 'matches' ? 'Matches' : 'Standings'}
              </button>
            ))}
          </div>

          <div className="px-4 pb-4">
            {groupView === 'matches' ? (
              <div className="flex flex-col gap-3">
                {groupMatches.map(match => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    userPrediction={saved[match.id]}
                    allUserPredictions={allSaved}
                    isAuthenticated={!!user}
                    userId={user?.id}
                  />
                ))}
              </div>
            ) : (
              <GroupStageTable standings={groupStandings} />
            )}
          </div>
        </div>
      )}

      {/* Knockout tab */}
      {tab === 'knockout' && (
        <div className="flex flex-col gap-6 px-4 py-3 pb-4">
          {KNOCKOUT_STAGES.map(stage => {
            const stageMatches = [...KNOCKOUT_MATCHES].filter(m => m.stage === stage).sort((a, b) => a.kickoffAt.localeCompare(b.kickoffAt));
            return (
              <div key={stage}>
                <h2 className="mb-2 text-xs font-bold uppercase tracking-widest" style={{ color: '#5A6E94' }}>{STAGE_LABELS[stage]}</h2>
                <div className="flex flex-col gap-3">
                  {stageMatches.map(match => (
                    <MatchCard
                      key={match.id}
                      match={match}
                      userPrediction={saved[match.id]}
                      allUserPredictions={allSaved}
                      isAuthenticated={!!user}
                      userId={user?.id}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Bracket tab */}
      {tab === 'bracket' && <BracketView />}
    </div>
  );
}

export default function SchedulePage() {
  return (
    <ClientOnly fallback={
      <div className="flex flex-col gap-3 p-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-xl bg-card" />
        ))}
      </div>
    }>
      <ScheduleContent />
    </ClientOnly>
  );
}
