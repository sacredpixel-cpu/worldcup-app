'use client';

import { useMemo } from 'react';
import { useMatchesStore } from '@/store/slices/matchesSlice';
import { FlagImage } from '@/components/ui/FlagImage';

// Medal colours
const RANK_STYLE: Record<number, { bg: string; border: string; color: string }> = {
  1: { bg: 'rgba(255,176,32,0.12)',  border: 'rgba(255,176,32,0.35)',   color: '#FFB020' },
  2: { bg: 'rgba(192,192,192,0.08)', border: 'rgba(192,192,192,0.25)',  color: '#C0C0C0' },
  3: { bg: 'rgba(205,127,50,0.08)',  border: 'rgba(205,127,50,0.25)',   color: '#CD7F32' },
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
    <div style={{
      width: 28, height: 28, borderRadius: '50%',
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: '#7A91BB', fontFamily: 'var(--font-barlow-condensed)' }}>
        {rank}
      </span>
    </div>
  );
}

interface ScorerEntry { player: string; teamCode: string; goals: number }

function ScorerRow({ scorer, rank, isLast }: { scorer: ScorerEntry; rank: number; isLast: boolean }) {
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
        <p style={{
          fontSize: 14, fontWeight: 700, color: '#E8F0FF',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.2,
        }}>
          {scorer.player}
        </p>
        <p style={{ fontSize: 11, color: '#7A91BB', lineHeight: 1.2, marginTop: 2 }}>
          {scorer.teamCode}
        </p>
      </div>

      <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
        <span style={{
          fontFamily: 'var(--font-barlow-condensed)',
          fontSize: 22, fontWeight: 900,
          color: rank === 1 ? '#FFB020' : '#E8F0FF',
          lineHeight: 1,
        }}>
          {scorer.goals}
        </span>
        <span style={{ fontSize: 9, fontWeight: 600, color: '#5A6E94', textTransform: 'uppercase', letterSpacing: '0.06em', lineHeight: 1 }}>
          {scorer.goals === 1 ? 'goal' : 'goals'}
        </span>
      </div>
    </div>
  );
}

export function GoalsTab() {
  const { updates } = useMatchesStore();

  // Aggregate goalScorerEvents across all match updates
  const scorers = useMemo(() => {
    const map = new Map<string, ScorerEntry>();

    for (const update of Object.values(updates)) {
      const events = update.goalScorerEvents;
      if (!events || events.length === 0) continue;

      for (const ev of events) {
        if (!ev.player || ev.goals <= 0) continue;
        const key = `${ev.player}::${ev.teamCode}`;
        const existing = map.get(key) ?? { player: ev.player, teamCode: ev.teamCode, goals: 0 };
        existing.goals += ev.goals;
        map.set(key, existing);
      }
    }

    return Array.from(map.values()).sort((a, b) => b.goals - a.goals || a.player.localeCompare(b.player));
  }, [updates]);

  if (scorers.length === 0) {
    return (
      <div style={{
        padding: '48px 24px', display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: 12, textAlign: 'center',
      }}>
        <span style={{ fontSize: 40 }}>⚽</span>
        <p style={{ fontSize: 15, fontWeight: 700, color: '#E8F0FF' }}>No goals yet</p>
        <p style={{ fontSize: 13, color: '#7A91BB', lineHeight: 1.5, maxWidth: 260 }}>
          Goal tallies update live as matches are played. Check back on June 11 for the first games.
        </p>
      </div>
    );
  }

  // Assign ranks — tied scorers share the same rank
  let rank = 1;
  const ranked: Array<{ scorer: ScorerEntry; rank: number }> = [];
  for (let i = 0; i < scorers.length; i++) {
    if (i > 0 && scorers[i].goals < scorers[i - 1].goals) rank = i + 1;
    ranked.push({ scorer: scorers[i], rank });
  }

  return (
    <div style={{ paddingBottom: 24 }}>
      {/* Header banner */}
      <div style={{
        margin: '12px 16px 0',
        padding: '10px 14px',
        borderRadius: 12,
        background: 'rgba(255,176,32,0.06)',
        border: '1px solid rgba(255,176,32,0.18)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
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

      {/* Scorer list */}
      <div style={{
        margin: '12px 16px 0',
        borderRadius: 14, overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.07)',
        background: '#0E1535',
      }}>
        {ranked.map(({ scorer, rank }, i) => (
          <ScorerRow
            key={`${scorer.player}::${scorer.teamCode}`}
            scorer={scorer}
            rank={rank}
            isLast={i === ranked.length - 1}
          />
        ))}
      </div>

      {/* Disclaimer */}
      <p style={{ margin: '10px 16px 0', fontSize: 11, color: '#5A6E94', lineHeight: 1.5 }}>
        Updated every 2 minutes from live match data. Penalty shootout goals excluded per Golden Boot rules.
      </p>
    </div>
  );
}
