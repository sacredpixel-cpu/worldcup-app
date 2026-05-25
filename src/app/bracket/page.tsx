'use client';

import { GROUP_STAGE_MATCHES } from '@/data/matches';
import { BracketView } from '@/components/bracket/BracketView';
import { FlagImage } from '@/components/ui/FlagImage';
import type { Match } from '@/types/match';

const GROUP_LETTERS = ['A','B','C','D','E','F','G','H','I','J','K','L'];

function shortDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
}

function GroupMatchRow({ match }: { match: Match }) {
  const isFinished = match.status === 'finished' && match.homeScore !== null;
  const isLive = match.status === 'live';
  const hasScore = isFinished || isLive;
  const homeWon = isFinished && match.homeScore! > match.awayScore!;
  const awayWon = isFinished && match.homeScore! < match.awayScore!;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      padding: '7px 12px',
      gap: 8,
      borderBottom: '1px solid rgba(255,255,255,0.04)',
    }}>
      {/* Home team (right-aligned) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, flex: 1, justifyContent: 'flex-end' }}>
        <span style={{
          fontSize: 11,
          fontWeight: homeWon ? 700 : 500,
          color: homeWon ? '#E8F0FF' : isFinished ? '#5A6E94' : '#9AAED4',
        }}>
          {match.homeTeam.code}
        </span>
        <FlagImage code={match.homeTeam.code} size={18} />
      </div>

      {/* Score or date */}
      <div style={{ textAlign: 'center', minWidth: 52, flexShrink: 0 }}>
        {hasScore ? (
          <span style={{
            fontSize: 13,
            fontWeight: 800,
            color: isLive ? '#FF4DA8' : '#E8F0FF',
            fontFamily: 'var(--font-barlow-condensed)',
          }}>
            {match.homeScore} – {match.awayScore}
          </span>
        ) : (
          <span style={{ fontSize: 10, color: '#5A6E94', lineHeight: 1 }}>
            {shortDate(match.kickoffAt)}
          </span>
        )}
      </div>

      {/* Away team (left-aligned) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, flex: 1 }}>
        <FlagImage code={match.awayTeam.code} size={18} />
        <span style={{
          fontSize: 11,
          fontWeight: awayWon ? 700 : 500,
          color: awayWon ? '#E8F0FF' : isFinished ? '#5A6E94' : '#9AAED4',
        }}>
          {match.awayTeam.code}
        </span>
      </div>

      {/* City */}
      <span style={{
        fontSize: 9,
        color: '#3A4E6E',
        minWidth: 56,
        maxWidth: 72,
        textAlign: 'right',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        flexShrink: 0,
      }}>
        {match.city.split(',')[0]}
      </span>
    </div>
  );
}

export default function BracketPage() {
  const groupMatches: Record<string, Match[]> = {};
  for (const letter of GROUP_LETTERS) {
    groupMatches[letter] = GROUP_STAGE_MATCHES
      .filter(m => m.homeTeam.group === letter)
      .sort((a, b) => a.kickoffAt.localeCompare(b.kickoffAt));
  }

  return (
    <div className="flex flex-col pb-8">
      {/* Header */}
      <div className="px-4 pt-4 pb-3">
        <h1 className="text-2xl font-black" style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#E8F0FF', letterSpacing: '0.02em' }}>BRACKET</h1>
        <p className="text-xs" style={{ color: '#7A91BB' }}>Full tournament · Jun 11 – Jul 19</p>
      </div>

      {/* Group Stage */}
      <div className="px-4">
        <h2 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#5A6E94' }}>
          Group Stage
        </h2>
        <div className="flex flex-col gap-2">
          {GROUP_LETTERS.map(letter => (
            <div
              key={letter}
              style={{
                background: '#0A1128',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 10,
                overflow: 'hidden',
              }}
            >
              <div style={{
                padding: '7px 12px',
                background: 'rgba(255,255,255,0.03)',
                borderBottom: '1px solid rgba(255,255,255,0.07)',
              }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#9AAED4', letterSpacing: '0.06em' }}>
                  GROUP {letter}
                </span>
              </div>
              {groupMatches[letter].map(match => (
                <GroupMatchRow key={match.id} match={match} />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Knockout Bracket */}
      <div className="px-4 mt-6 mb-2">
        <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: '#5A6E94' }}>
          Knockout Stage
        </h2>
      </div>
      <BracketView />
    </div>
  );
}
