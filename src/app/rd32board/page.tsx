'use client';

import { useState } from 'react';
import Image from 'next/image';

// ─── Mock data ────────────────────────────────────────────────────────────────

interface Entry {
  userId: string;
  displayName: string;
  avatarUrl: string;
  country: string;
  countryCode: string;
  rd32Points: number;
  allTimePoints: number;
}

const USERS: Entry[] = [
  { userId: '1',  displayName: 'Cristiano_Fan',  avatarUrl: 'https://i.pravatar.cc/150?u=1',  country: 'Brazil',        countryCode: 'br',     rd32Points: 10, allTimePoints: 42 },
  { userId: '2',  displayName: 'GoalKing88',      avatarUrl: 'https://i.pravatar.cc/150?u=2',  country: 'Mexico',        countryCode: 'mx',     rd32Points: 8,  allTimePoints: 38 },
  { userId: '3',  displayName: 'TacticsMaestro',  avatarUrl: 'https://i.pravatar.cc/150?u=3',  country: 'Germany',       countryCode: 'de',     rd32Points: 7,  allTimePoints: 35 },
  { userId: '4',  displayName: 'SoccerOracle',    avatarUrl: 'https://i.pravatar.cc/150?u=4',  country: 'Argentina',     countryCode: 'ar',     rd32Points: 6,  allTimePoints: 31 },
  { userId: '5',  displayName: 'PredictionKing',  avatarUrl: 'https://i.pravatar.cc/150?u=5',  country: 'France',        countryCode: 'fr',     rd32Points: 5,  allTimePoints: 28 },
  { userId: '6',  displayName: 'WorldCupWizard',  avatarUrl: 'https://i.pravatar.cc/150?u=6',  country: 'Spain',         countryCode: 'es',     rd32Points: 4,  allTimePoints: 25 },
  { userId: '7',  displayName: 'FootballGuru',    avatarUrl: 'https://i.pravatar.cc/150?u=7',  country: 'England',       countryCode: 'gb-eng', rd32Points: 3,  allTimePoints: 22 },
  { userId: '8',  displayName: 'MatchAnalyst',    avatarUrl: 'https://i.pravatar.cc/150?u=8',  country: 'Italy',         countryCode: 'it',     rd32Points: 2,  allTimePoints: 18 },
  { userId: '9',  displayName: 'BallPark99',      avatarUrl: 'https://i.pravatar.cc/150?u=9',  country: 'United States', countryCode: 'us',     rd32Points: 1,  allTimePoints: 15 },
  { userId: '10', displayName: 'TacticsNerd',     avatarUrl: 'https://i.pravatar.cc/150?u=10', country: 'Japan',         countryCode: 'jp',     rd32Points: 1,  allTimePoints: 12 },
];

const MOCK_GROUPS = [
  { id: 'g1', name: 'LA Fútbol Crew',    members: ['Cristiano_Fan', 'GoalKing88', 'SoccerOracle'],   score: 18, countryCode: 'mx' },
  { id: 'g2', name: 'World Cup Nerds',   members: ['TacticsMaestro', 'PredictionKing'],              score: 12, countryCode: 'de' },
  { id: 'g3', name: 'Gol Squad',         members: ['WorldCupWizard', 'FootballGuru', 'BallPark99'],  score: 7,  countryCode: 'es' },
  { id: 'g4', name: 'Offside Alert',     members: ['MatchAnalyst', 'TacticsNerd'],                   score: 3,  countryCode: 'it' },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span style={{ fontSize: 22 }}>🥇</span>;
  if (rank === 2) return <span style={{ fontSize: 22 }}>🥈</span>;
  if (rank === 3) return <span style={{ fontSize: 22 }}>🥉</span>;
  return <span style={{ width: 32, textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#7A91BB', display: 'inline-block' }}>{rank}</span>;
}

function PlayerRow({ entry, rank, pts }: { entry: Entry; rank: number; pts: number }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      borderRadius: 12, padding: '12px 16px',
      background: '#0E1535', border: '1px solid rgba(255,255,255,0.06)',
    }}>
      <RankBadge rank={rank} />
      <Image src={entry.avatarUrl} alt={entry.displayName} width={36} height={36} style={{ borderRadius: '50%', objectFit: 'cover' }} unoptimized />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#C8D8F0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {entry.displayName}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`https://flagcdn.com/w20/${entry.countryCode}.png`} alt="" style={{ height: 12, width: 16, objectFit: 'cover', borderRadius: 2 }} />
          <span style={{ fontSize: 12, color: '#7A91BB' }}>{entry.country}</span>
        </div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <p style={{ margin: 0, fontSize: 20, fontWeight: 900, color: '#FFB020', fontFamily: 'var(--font-barlow-condensed)' }}>{pts}</p>
        <p style={{ margin: 0, fontSize: 10, color: '#7A91BB' }}>pts</p>
      </div>
    </div>
  );
}

function GroupRow({ group, rank }: { group: typeof MOCK_GROUPS[0]; rank: number }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      borderRadius: 12, padding: '12px 16px',
      background: '#0E1535', border: '1px solid rgba(255,255,255,0.06)',
    }}>
      <RankBadge rank={rank} />
      <div style={{
        width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
        background: '#1B263B', border: '1px solid rgba(255,255,255,0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
      }}>
        👥
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#C8D8F0' }}>{group.name}</p>
        <p style={{ margin: 0, fontSize: 12, color: '#7A91BB', marginTop: 2 }}>
          {group.members.length} members · top 2 scoring
        </p>
        <p style={{ margin: 0, fontSize: 11, color: '#5A6E94', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {group.members.slice(0, 2).join(' · ')}
        </p>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <p style={{ margin: 0, fontSize: 20, fontWeight: 900, color: '#FFB020', fontFamily: 'var(--font-barlow-condensed)' }}>{group.score}</p>
        <p style={{ margin: 0, fontSize: 10, color: '#7A91BB' }}>pts</p>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type Tab = 'rd32' | 'global' | 'groups';

export default function Rd32BoardPage() {
  const [tab, setTab] = useState<Tab>('rd32');

  const tabs: { id: Tab; label: string; isNew?: boolean }[] = [
    { id: 'rd32',   label: 'Round 32', isNew: true },
    { id: 'global', label: 'Top Fans' },
    { id: 'groups', label: 'Top Groups' },
  ];

  const rd32Board  = [...USERS].sort((a, b) => b.rd32Points - a.rd32Points);
  const globalBoard = [...USERS].sort((a, b) => b.allTimePoints - a.allTimePoints);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', fontFamily: 'var(--font-golos-text), sans-serif' }}>

      {/* Header */}
      <div style={{ padding: '16px 16px 12px' }}>
        <h1 style={{
          margin: 0, fontSize: 28, fontWeight: 900,
          fontFamily: 'var(--font-barlow-condensed), sans-serif',
          color: '#E8F0FF', letterSpacing: '0.02em',
        }}>
          LEADERBOARD
        </h1>
      </div>

      {/* Tab pills */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', padding: '0 16px 12px', scrollbarWidth: 'none' }}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={tab === t.id
              ? {
                  display: 'flex', alignItems: 'center', gap: 5,
                  fontSize: 12, fontWeight: 700, padding: '6px 14px', borderRadius: 20,
                  background: 'rgba(255,31,142,0.12)', border: '1px solid rgba(255,31,142,0.35)',
                  color: '#FF4DA8', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
                }
              : {
                  display: 'flex', alignItems: 'center', gap: 5,
                  fontSize: 12, fontWeight: 700, padding: '6px 14px', borderRadius: 20,
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                  color: '#7A91BB', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
                }}
          >
            {t.label}
            {t.isNew && (
              <span style={{
                fontSize: 9, fontWeight: 800, letterSpacing: '0.08em',
                background: tab === t.id ? 'rgba(255,31,142,0.25)' : 'rgba(255,176,32,0.2)',
                color: tab === t.id ? '#FF4DA8' : '#FFB020',
                border: `1px solid ${tab === t.id ? 'rgba(255,31,142,0.4)' : 'rgba(255,176,32,0.35)'}`,
                borderRadius: 4, padding: '1px 5px',
              }}>
                NEW
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Round 32 info banner */}
      {tab === 'rd32' && (
        <a
          href="https://inchastudios.com"
          style={{
            margin: '0 16px 12px',
            borderRadius: 12, padding: '10px 14px',
            background: 'rgba(255, 176, 32, 0.06)',
            border: '1px solid rgba(255, 176, 32, 0.2)',
            display: 'flex', alignItems: 'center', gap: 8,
            textDecoration: 'none', cursor: 'pointer',
          }}
        >
          <span style={{ fontSize: 16, flexShrink: 0 }}>🏆</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#FFB020' }}>Round of 32 Leaderboard</p>
            <p style={{ margin: 0, fontSize: 11, color: '#7A91BB', marginTop: 2, lineHeight: 1.4 }}>
              Fresh start — only Round of 32 predictions count here. Top 2 win{' '}
              <span style={{ color: '#778DA9', textDecoration: 'underline', fontWeight: 600 }}>inchastudios.com</span>
              {' '}gear.
            </p>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/inchalogo.png"
            alt="InchaStudios"
            style={{ width: 40, height: 34, objectFit: 'contain', filter: 'invert(1) brightness(0.7)', flexShrink: 0, marginLeft: 4 }}
          />
        </a>
      )}

      {/* Board content */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '0 16px 24px' }}>
        {tab === 'rd32' && rd32Board.map((entry, i) => (
          <PlayerRow key={entry.userId} entry={entry} rank={i + 1} pts={entry.rd32Points} />
        ))}

        {tab === 'global' && globalBoard.map((entry, i) => (
          <PlayerRow key={entry.userId} entry={entry} rank={i + 1} pts={entry.allTimePoints} />
        ))}

        {tab === 'groups' && MOCK_GROUPS.map((group, i) => (
          <GroupRow key={group.id} group={group} rank={i + 1} />
        ))}
      </div>
    </div>
  );
}
