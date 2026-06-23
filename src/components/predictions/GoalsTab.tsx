'use client';

import { useMemo, useState } from 'react';
import { useMatchesStore } from '@/store/slices/matchesSlice';
import { FlagImage } from '@/components/ui/FlagImage';

// ─── Shared styles ────────────────────────────────────────────────────────────

const RANK_STYLE: Record<number, { bg: string; border: string; color: string }> = {
  1: { bg: 'rgba(255,176,32,0.12)',  border: 'rgba(255,176,32,0.35)',  color: '#FFB020' },
  2: { bg: 'rgba(192,192,192,0.08)', border: 'rgba(192,192,192,0.25)', color: '#C0C0C0' },
  3: { bg: 'rgba(205,127,50,0.08)',  border: 'rgba(205,127,50,0.25)',  color: '#CD7F32' },
};

function RankBadge({ rank }: { rank: number }) {
  const style = RANK_STYLE[rank];
  if (style) {
    return (
      <div style={{
        width: 28, height: 28, borderRadius: '50%',
        background: style.bg, border: `1.5px solid ${style.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <span style={{ fontSize: 11, fontWeight: 900, color: style.color, fontFamily: 'var(--font-barlow-condensed)' }}>
          {rank}
        </span>
      </div>
    );
  }
  return (
    <div style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: '#7A91BB', fontFamily: 'var(--font-barlow-condensed)' }}>
        {rank}
      </span>
    </div>
  );
}

// ─── World Cup 2026 tab ───────────────────────────────────────────────────────

interface ScorerEntry { player: string; teamCode: string; goals: number; penaltyGoals: number }

function WC2026ScorerRow({ scorer, rank, isLast }: { scorer: ScorerEntry; rank: number; isLast: boolean }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '10px 16px',
      borderBottom: isLast ? 'none' : '1px solid rgba(255,255,255,0.05)',
    }}>
      <RankBadge rank={rank} />
      <div style={{ flexShrink: 0 }}>
        <FlagImage code={scorer.teamCode} size={22} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: '#E8F0FF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.2 }}>
          {scorer.player}
        </p>
        <p style={{ fontSize: 11, color: '#7A91BB', lineHeight: 1.2, marginTop: 2 }}>
          {scorer.teamCode}
        </p>
      </div>
      <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
        <span style={{ fontFamily: 'var(--font-barlow-condensed)', fontSize: 22, fontWeight: 900, color: rank === 1 ? '#FFB020' : '#E8F0FF', lineHeight: 1 }}>
          {scorer.goals}
        </span>
        <span style={{ fontSize: 9, fontWeight: 600, color: '#5A6E94', textTransform: 'uppercase' as const, letterSpacing: '0.06em', lineHeight: 1 }}>
          {scorer.goals === 1 ? 'goal' : 'goals'}
        </span>
        {scorer.penaltyGoals > 0 && (
          <span style={{ fontSize: 9, fontWeight: 600, color: '#FF4DA8', letterSpacing: '0.04em', lineHeight: 1 }}>
            {scorer.penaltyGoals} pen
          </span>
        )}
      </div>
    </div>
  );
}

function WC2026Tab() {
  const { updates } = useMatchesStore();

  const scorers = useMemo(() => {
    const map = new Map<string, ScorerEntry>();
    for (const update of Object.values(updates)) {
      const events = update.goalScorerEvents;
      if (!events || events.length === 0) continue;
      for (const ev of events) {
        if (!ev.player || ev.goals <= 0) continue;
        const key = `${ev.player}::${ev.teamCode}`;
        const existing = map.get(key) ?? { player: ev.player, teamCode: ev.teamCode, goals: 0, penaltyGoals: 0 };
        existing.goals += ev.goals;
        existing.penaltyGoals += ev.penaltyGoals ?? 0;
        map.set(key, existing);
      }
    }
    return Array.from(map.values()).sort((a, b) => b.goals - a.goals || a.player.localeCompare(b.player));
  }, [updates]);

  if (scorers.length === 0) {
    return (
      <div style={{ padding: '48px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center' }}>
        <span style={{ fontSize: 40 }}>⚽</span>
        <p style={{ fontSize: 15, fontWeight: 700, color: '#E8F0FF' }}>No goals yet</p>
        <p style={{ fontSize: 13, color: '#7A91BB', lineHeight: 1.5, maxWidth: 260 }}>
          Goal tallies update live as matches are played. Check back on June 11 for the first games.
        </p>
      </div>
    );
  }

  let rank = 1;
  const ranked: Array<{ scorer: ScorerEntry; rank: number }> = [];
  for (let i = 0; i < scorers.length; i++) {
    if (i > 0 && scorers[i].goals < scorers[i - 1].goals) rank = i + 1;
    ranked.push({ scorer: scorers[i], rank });
  }

  return (
    <div style={{ paddingBottom: 24 }}>
      <div style={{ margin: '12px 16px 0', padding: '10px 14px', borderRadius: 12, background: 'rgba(255,176,32,0.06)', border: '1px solid rgba(255,176,32,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 13, color: '#9AAED4' }}>
          {'Top scorer: '}
          <span style={{ color: '#E8F0FF', fontWeight: 700 }}>{scorers[0].player}</span>
          {' — '}
          <span style={{ color: '#FFB020', fontWeight: 700 }}>{scorers[0].goals}</span>
          {scorers[0].goals === 1 ? ' goal' : ' goals'}
        </span>
        <span style={{ fontSize: 11, color: '#7A91BB', flexShrink: 0, marginLeft: 8 }}>
          {scorers.length} scorer{scorers.length !== 1 ? 's' : ''}
        </span>
      </div>
      <div style={{ margin: '12px 16px 0', borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.07)', background: '#0E1535' }}>
        {ranked.map(({ scorer, rank }, i) => (
          <WC2026ScorerRow
            key={`${scorer.player}::${scorer.teamCode}`}
            scorer={scorer}
            rank={rank}
            isLast={i === ranked.length - 1}
          />
        ))}
      </div>
      <p style={{ margin: '10px 16px 0', fontSize: 11, color: '#5A6E94', lineHeight: 1.5 }}>
        Updated every 2 minutes from live match data. Penalty shootout goals excluded per Golden Boot rules. Pink "pen" label indicates goals from spot kicks.
      </p>
    </div>
  );
}

// ─── All-time tab ─────────────────────────────────────────────────────────────

interface AllTimeEntry {
  player: string;
  country: string;
  countryCode: string;
  goals: number;
  penaltyGoals: number;
  years: string;
  active?: boolean;
}

const ALL_TIME_SCORERS: AllTimeEntry[] = [
  { player: 'Miroslav Klose',    country: 'Germany',   countryCode: 'GER', goals: 16, penaltyGoals: 0, years: '2002–14' },
  { player: 'Ronaldo Nazário',   country: 'Brazil',    countryCode: 'BRA', goals: 15, penaltyGoals: 4, years: '1994–2006' },
  { player: 'Gerd Müller',       country: 'Germany',   countryCode: 'GER', goals: 14, penaltyGoals: 1, years: '1970–74' },
  { player: 'Just Fontaine',     country: 'France',    countryCode: 'FRA', goals: 13, penaltyGoals: 0, years: '1958' },
  { player: 'Pelé',              country: 'Brazil',    countryCode: 'BRA', goals: 12, penaltyGoals: 0, years: '1958–70' },
  { player: 'Kylian Mbappé',     country: 'France',    countryCode: 'FRA', goals: 12, penaltyGoals: 3, years: '2018–22', active: true },
  { player: 'Sándor Kocsis',     country: 'Hungary',   countryCode: 'HUN', goals: 11, penaltyGoals: 0, years: '1954' },
  { player: 'Jürgen Klinsmann',  country: 'Germany',   countryCode: 'GER', goals: 11, penaltyGoals: 2, years: '1990–98' },
  { player: 'Helmut Rahn',       country: 'Germany',   countryCode: 'GER', goals: 10, penaltyGoals: 0, years: '1950–58' },
  { player: 'Teófilo Cubillas',  country: 'Peru',      countryCode: 'PER', goals: 10, penaltyGoals: 2, years: '1970–78' },
  { player: 'Grzegorz Lato',     country: 'Poland',    countryCode: 'POL', goals: 10, penaltyGoals: 0, years: '1974–82' },
  { player: 'Gary Lineker',      country: 'England',   countryCode: 'ENG', goals: 10, penaltyGoals: 2, years: '1986–90' },
  { player: 'Gabriel Batistuta', country: 'Argentina', countryCode: 'ARG', goals: 10, penaltyGoals: 2, years: '1994–2002' },
  { player: 'Thomas Müller',     country: 'Germany',   countryCode: 'GER', goals: 10, penaltyGoals: 0, years: '2010–18' },
  { player: 'Eusébio',           country: 'Portugal',  countryCode: 'POR', goals:  9, penaltyGoals: 4, years: '1966' },
  { player: 'Uwe Seeler',        country: 'Germany',   countryCode: 'GER', goals:  9, penaltyGoals: 0, years: '1958–70' },
  { player: 'Ademir',            country: 'Brazil',    countryCode: 'BRA', goals:  9, penaltyGoals: 0, years: '1950' },
  { player: 'David Villa',       country: 'Spain',     countryCode: 'ESP', goals:  9, penaltyGoals: 1, years: '2006–14' },
  { player: 'Cristiano Ronaldo', country: 'Portugal',  countryCode: 'POR', goals:  8, penaltyGoals: 2, years: '2002–22', active: true },
];

function AllTimeRow({ entry, rank, isLast }: { entry: AllTimeEntry; rank: number; isLast: boolean }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '9px 14px',
      borderBottom: isLast ? 'none' : '1px solid rgba(255,255,255,0.05)',
    }}>
      <RankBadge rank={rank} />
      <div style={{ flexShrink: 0 }}>
        <FlagImage code={entry.countryCode} size={20} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#E8F0FF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.2 }}>
            {entry.player}
          </p>
          {entry.active && (
            <span style={{ fontSize: 8, fontWeight: 700, color: '#00C44F', background: 'rgba(0,196,79,0.12)', border: '1px solid rgba(0,196,79,0.25)', borderRadius: 4, padding: '1px 4px', flexShrink: 0, letterSpacing: '0.05em' }}>
              ACTIVE
            </span>
          )}
        </div>
        <p style={{ fontSize: 10, color: '#5A6E94', lineHeight: 1.2, marginTop: 2 }}>
          {entry.country} · {entry.years}
        </p>
      </div>
      <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
        <span style={{ fontFamily: 'var(--font-barlow-condensed)', fontSize: 20, fontWeight: 900, color: rank === 1 ? '#FFB020' : '#E8F0FF', lineHeight: 1 }}>
          {entry.goals}
        </span>
        <span style={{ fontSize: 8, fontWeight: 600, color: '#5A6E94', textTransform: 'uppercase' as const, letterSpacing: '0.06em', lineHeight: 1 }}>
          goals
        </span>
        {entry.penaltyGoals > 0 && (
          <span style={{ fontSize: 8, fontWeight: 600, color: '#FF4DA8', letterSpacing: '0.04em', lineHeight: 1 }}>
            {entry.penaltyGoals} pen
          </span>
        )}
      </div>
    </div>
  );
}

function AllTimeTab() {
  // Assign ranks — tied scorers share the same rank
  let rank = 1;
  const ranked: Array<{ entry: AllTimeEntry; rank: number }> = [];
  for (let i = 0; i < ALL_TIME_SCORERS.length; i++) {
    if (i > 0 && ALL_TIME_SCORERS[i].goals < ALL_TIME_SCORERS[i - 1].goals) rank = i + 1;
    ranked.push({ entry: ALL_TIME_SCORERS[i], rank });
  }

  return (
    <div style={{ paddingBottom: 24 }}>
      <div style={{ margin: '12px 16px 0', padding: '9px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 12, color: '#7A91BB' }}>All-time World Cup goal scorers</span>
        <span style={{ fontSize: 10, color: '#5A6E94', flexShrink: 0, marginLeft: 8 }}>through 2022</span>
      </div>
      <div style={{ margin: '12px 16px 0', borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.07)', background: '#0E1535' }}>
        {ranked.map(({ entry, rank }, i) => (
          <AllTimeRow
            key={`${entry.player}::${entry.countryCode}`}
            entry={entry}
            rank={rank}
            isLast={i === ranked.length - 1}
          />
        ))}
      </div>
      <p style={{ margin: '10px 16px 0', fontSize: 11, color: '#5A6E94', lineHeight: 1.5 }}>
        Penalty shootout goals excluded. "ACTIVE" players are competing in the 2026 World Cup and their totals will increase. Pink "pen" label indicates goals scored from the penalty spot.
      </p>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function GoalsTab() {
  const [subTab, setSubTab] = useState<'wc2026' | 'alltime'>('wc2026');

  return (
    <div>
      {/* Subtab bar */}
      <div style={{ display: 'flex', padding: '0 16px', marginTop: 12, gap: 4 }}>
        {([
          { id: 'wc2026'  as const, label: 'World Cup 2026' },
          { id: 'alltime' as const, label: 'All-time'       },
        ]).map(t => (
          <button
            key={t.id}
            onClick={() => setSubTab(t.id)}
            className="no-press-ring"
            style={{
              fontSize: 12, fontWeight: 700, padding: '6px 14px', borderRadius: 20,
              background: subTab === t.id ? 'rgba(255,31,142,0.12)' : 'rgba(255,255,255,0.04)',
              border: subTab === t.id ? '1px solid rgba(255,31,142,0.35)' : '1px solid rgba(255,255,255,0.08)',
              color: subTab === t.id ? '#FF4DA8' : '#7A91BB',
              cursor: 'pointer',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {subTab === 'wc2026'  && <WC2026Tab />}
      {subTab === 'alltime' && <AllTimeTab />}
    </div>
  );
}
