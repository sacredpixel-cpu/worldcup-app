'use client';

import { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { FlagImage } from '@/components/ui/FlagImage';
import { usePredictionsStore } from '@/store';
import { ROSTERS } from '@/data/rosters';
import { calcPoints } from '@/lib/utils/calcPoints';
import { getGradingScore } from '@/lib/utils/getGradingScore';
import type { TeamHistory } from '@/data/rosters';
import type { Match } from '@/types/match';
import type { Prediction } from '@/types/prediction';

// ── Score stepper (null = "–" / unset) ──────────────────────────────────────

function ScoreStepper({
  value,
  onChange,
  locked,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
  locked: boolean;
}) {
  return (
    <div className="flex items-center gap-4">
      <button
        disabled={locked || value === null || value <= 0}
        onClick={() => onChange(value! - 1)}
        className="flex h-11 w-11 items-center justify-center rounded-xl text-xl font-bold disabled:opacity-30 active:scale-90"
        style={{ border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.06)', color: '#E8F0FF' }}
      >−</button>

      <span
        className="w-10 text-center text-3xl font-black"
        style={{
          color: value === null ? '#3A4E6E' : '#E8F0FF',
          fontFamily: 'var(--font-barlow-condensed)',
          letterSpacing: '0.02em',
        }}
      >
        {value === null ? '–' : value}
      </span>

      <button
        disabled={locked || (value !== null && value >= 10)}
        onClick={() => onChange(value === null ? 0 : value + 1)}
        className="flex h-11 w-11 items-center justify-center rounded-xl text-xl font-bold disabled:opacity-30 active:scale-90"
        style={{ border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.06)', color: '#E8F0FF' }}
      >+</button>
    </div>
  );
}

// ── Country name abbreviator ─────────────────────────────────────────────────

function abbrevCountry(name: string): string {
  return name
    .replace(/^South /, 'S. ')
    .replace(/^North /, 'N. ')
    .replace(/^East /, 'E. ')
    .replace(/^West /, 'W. ')
    .replace(/^Saudi /, 'S. ')
    .replace(/^United /, 'U. ')
    .replace(/^Cape /, 'C. ')
    .replace('Bosnia & Herzegovina', 'Bosnia');
}

// ── Team face-off panel ──────────────────────────────────────────────────────

const STAT_ROWS: { label: string; key: keyof TeamHistory }[] = [
  { label: 'World Cup apps',  key: 'appearances' },
  { label: 'Round of 16',     key: 'passed_group_stage' },
  { label: 'Quarter-finals',  key: 'quarter_finals' },
  { label: 'Semi-finals',     key: 'semi_finals' },
  { label: 'Finals',          key: 'finals' },
  { label: 'Wins',            key: 'wins' },
];

function TeamFaceOff({ match }: { match: Match }) {
  const homeRoster = ROSTERS[match.homeTeam.id];
  const awayRoster = ROSTERS[match.awayTeam.id];

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', gap: 16, padding: '14px 10px 10px' }}>
        {/* Home */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 52, height: 52, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', border: '1.5px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
            <FlagImage code={match.homeTeam.code} size={36} className="rounded-sm" />
          </div>
          <span style={{ fontSize: 24, fontWeight: 900, color: '#E8F0FF', lineHeight: 1.1, textAlign: 'center', fontFamily: 'var(--font-barlow-condensed)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{abbrevCountry(match.homeTeam.name)}</span>
          {homeRoster?.nickname && <span style={{ fontSize: 13, color: '#7A91BB', fontStyle: 'italic', textAlign: 'center' }}>"{homeRoster.nickname}"</span>}
          {homeRoster?.coach    && <span style={{ fontSize: 12, color: '#6A82A8', textAlign: 'center' }}>{homeRoster.coach}</span>}
        </div>

        {/* VS */}
        <div style={{ display: 'flex', alignItems: 'center', paddingTop: 14, flexShrink: 0 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#3A4E6E', letterSpacing: '0.06em' }}>VS</span>
        </div>

        {/* Away */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 52, height: 52, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', border: '1.5px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
            <FlagImage code={match.awayTeam.code} size={36} className="rounded-sm" />
          </div>
          <span style={{ fontSize: 24, fontWeight: 900, color: '#E8F0FF', lineHeight: 1.1, textAlign: 'center', fontFamily: 'var(--font-barlow-condensed)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{abbrevCountry(match.awayTeam.name)}</span>
          {awayRoster?.nickname && <span style={{ fontSize: 13, color: '#7A91BB', fontStyle: 'italic', textAlign: 'center' }}>"{awayRoster.nickname}"</span>}
          {awayRoster?.coach    && <span style={{ fontSize: 12, color: '#6A82A8', textAlign: 'center' }}>{awayRoster.coach}</span>}
        </div>
      </div>

      {(homeRoster || awayRoster) && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 8, fontWeight: 700, color: '#5A6E94', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'center', display: 'block', marginBottom: 2 }}>Tournament History</span>
          {STAT_ROWS.map(({ label, key }) => {
            const hv = homeRoster?.history[key] ?? '–';
            const av = awayRoster?.history[key] ?? '–';
            return (
              <div key={key} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', alignItems: 'center' }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#C8D8F0', textAlign: 'right', fontFamily: 'var(--font-barlow-condensed)', paddingRight: 8 }}>{hv}</span>
                <span style={{ fontSize: 13, color: '#C8D8F0', textAlign: 'center', lineHeight: 1.3 }}>{label}</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#C8D8F0', textAlign: 'left', fontFamily: 'var(--font-barlow-condensed)', paddingLeft: 8 }}>{av}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Scorer picker ────────────────────────────────────────────────────────────

type Position = 'forwards' | 'midfielders' | 'defenders' | 'goalkeepers';
const POS_LABELS: Record<Position, string> = { forwards: 'FWD', midfielders: 'MID', defenders: 'DEF', goalkeepers: 'GK' };
const POSITIONS: Position[] = ['forwards', 'midfielders', 'defenders', 'goalkeepers'];

function SideBySidePicker({
  match, homePicks, onHomePicks, awayPicks, onAwayPicks, locked,
}: {
  match: Match;
  homePicks: string[]; onHomePicks: (p: string[]) => void;
  awayPicks: string[]; onAwayPicks: (p: string[]) => void;
  locked: boolean;
}) {
  const homeRoster = ROSTERS[match.homeTeam.id];
  const awayRoster = ROSTERS[match.awayTeam.id];

  function toggle(picks: string[], onChange: (p: string[]) => void, name: string) {
    if (locked) return;
    if (picks.includes(name)) onChange(picks.filter(p => p !== name));
    else if (picks.length < 2) onChange([...picks, name]);
  }

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ padding: '8px 10px', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#E8F0FF' }}>{match.homeTeam.name}</div>
          <div style={{ fontSize: 9, color: homePicks.length === 2 ? '#FF4DA8' : '#5A6E94', marginTop: 1 }}>{homePicks.length}/2 selected</div>
        </div>
        <div style={{ padding: '8px 10px', textAlign: 'right' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#E8F0FF' }}>{match.awayTeam.name}</div>
          <div style={{ fontSize: 9, color: awayPicks.length === 2 ? '#FF4DA8' : '#5A6E94', marginTop: 1 }}>{awayPicks.length}/2 selected</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
        <div style={{ borderRight: '1px solid rgba(255,255,255,0.06)', padding: '8px 0' }}>
          {POSITIONS.map(pos => {
            const players = homeRoster?.squad[pos] ?? [];
            if (!players.length) return null;
            return (
              <div key={pos}>
                <div style={{ fontSize: 8, fontWeight: 700, color: '#FF4DA8', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '6px 10px 3px' }}>{POS_LABELS[pos]}</div>
                {players.map(name => {
                  const selected = homePicks.includes(name);
                  const maxed = homePicks.length >= 2 && !selected;
                  return (
                    <button key={name} disabled={locked || maxed} onClick={() => toggle(homePicks, onHomePicks, name)} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '6px 10px', fontSize: 12, lineHeight: 1.4, fontWeight: selected ? 700 : 400, color: selected ? '#00C44F' : maxed ? 'rgba(154,174,212,0.3)' : '#9AAED4', background: selected ? 'rgba(0,196,79,0.08)' : 'transparent', borderLeft: selected ? '2px solid #00C44F' : '2px solid transparent', cursor: locked || maxed ? 'default' : 'pointer', WebkitTapHighlightColor: 'transparent' }}>
                      {name}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
        <div style={{ padding: '8px 0' }}>
          {POSITIONS.map(pos => {
            const players = awayRoster?.squad[pos] ?? [];
            if (!players.length) return null;
            return (
              <div key={pos}>
                <div style={{ fontSize: 8, fontWeight: 700, color: '#FF4DA8', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '6px 10px 3px', textAlign: 'right' }}>{POS_LABELS[pos]}</div>
                {players.map(name => {
                  const selected = awayPicks.includes(name);
                  const maxed = awayPicks.length >= 2 && !selected;
                  return (
                    <button key={name} disabled={locked || maxed} onClick={() => toggle(awayPicks, onAwayPicks, name)} style={{ display: 'block', width: '100%', textAlign: 'right', padding: '6px 10px', fontSize: 12, lineHeight: 1.4, fontWeight: selected ? 700 : 400, color: selected ? '#FF4DA8' : maxed ? 'rgba(154,174,212,0.3)' : '#9AAED4', background: selected ? 'rgba(255,77,168,0.08)' : 'transparent', borderRight: selected ? '2px solid #FF4DA8' : '2px solid transparent', cursor: locked || maxed ? 'default' : 'pointer', WebkitTapHighlightColor: 'transparent' }}>
                      {name}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Share logic (shared between SharePanel and CompactShareBar) ───────────────

function buildShareContent(match: Match, prediction: Prediction, userId: string) {
  const shareUrl = `https://myworldcupschedule.com/share/${match.id}/${userId}?h=${prediction.homeScore}&a=${prediction.awayScore}`;
  const caption  = `I'm predicting ${match.homeTeam.name} ${prediction.homeScore}–${prediction.awayScore} ${match.awayTeam.name} at the 2026 FIFA World Cup! Can you do better?\n\n${shareUrl}`;
  const fbUrl    = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
  return { shareUrl, caption, fbUrl };
}

async function nativeShare(shareUrl: string, caption: string, match: Match, prediction: Prediction, setStatus: (s: 'idle' | 'copied') => void) {
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({
        title: `${match.homeTeam.name} ${prediction.homeScore}–${prediction.awayScore} ${match.awayTeam.name} — My World Cup Prediction`,
        text: caption,
        url: shareUrl,
      });
      return;
    } catch {}
  }
  await navigator.clipboard.writeText(caption);
  setStatus('copied');
  setTimeout(() => setStatus('idle'), 2500);
}

// FB / IG / TT SVG icons
const FBIcon = () => (
  <svg viewBox="0 0 24 24" style={{ width: 16, height: 16, fill: 'white' }}>
    <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.791-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
  </svg>
);
const IGIcon = () => (
  <svg viewBox="0 0 24 24" style={{ width: 16, height: 16, fill: 'white' }}>
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
  </svg>
);
const TTIcon = () => (
  <svg viewBox="0 0 24 24" style={{ width: 16, height: 16, fill: 'white' }}>
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.79 1.53V6.77a4.85 4.85 0 01-1.02-.08z" />
  </svg>
);

// ── Full share panel (used in share phase after first submit) ─────────────────

function SharePanel({ match, prediction, userId }: { match: Match; prediction: Prediction; userId: string }) {
  const [status, setStatus] = useState<'idle' | 'copied'>('idle');
  const { shareUrl, caption, fbUrl } = buildShareContent(match, prediction, userId);

  return (
    <div className="rounded-xl p-3 space-y-2" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <p className="text-xs font-semibold" style={{ color: '#7A91BB' }}>Share your prediction</p>
      <div className="flex gap-2">
        <button
          onClick={() => nativeShare(shareUrl, caption, match, prediction, setStatus)}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold active:scale-95"
          style={{ border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.06)', color: '#E8F0FF' }}
        >
          {status === 'copied' ? '✓ Copied!' : '↑ Post'}
        </button>
        <a href={fbUrl} target="_blank" rel="noopener noreferrer" className="flex h-9 w-9 items-center justify-center rounded-lg active:scale-95 flex-shrink-0" style={{ background: '#1877F2' }}>
          <FBIcon />
        </a>
        <button onClick={async () => { await navigator.clipboard.writeText(caption); setStatus('copied'); setTimeout(() => setStatus('idle'), 2500); window.open('https://www.instagram.com/create/story', '_blank'); }} className="flex h-9 w-9 items-center justify-center rounded-lg active:scale-95 flex-shrink-0" style={{ background: 'linear-gradient(45deg,#f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%)' }}>
          <IGIcon />
        </button>
        <button onClick={async () => { await navigator.clipboard.writeText(caption); setStatus('copied'); setTimeout(() => setStatus('idle'), 2500); window.open('https://www.tiktok.com/upload', '_blank'); }} className="flex h-9 w-9 items-center justify-center rounded-lg active:scale-95 flex-shrink-0" style={{ background: '#000', border: '1px solid rgba(255,255,255,0.12)' }}>
          <TTIcon />
        </button>
      </div>
      {status === 'copied' && (
        <p className="text-center text-[10px]" style={{ color: '#7A91BB' }}>Caption copied — paste it into your post!</p>
      )}
    </div>
  );
}

// ── Compact share bar (used in sticky footer for return / locked users) ───────

function CompactShareBar({ match, prediction, userId }: { match: Match; prediction: Prediction; userId: string }) {
  const [status, setStatus] = useState<'idle' | 'copied'>('idle');
  const { shareUrl, caption, fbUrl } = buildShareContent(match, prediction, userId);

  return (
    <div style={{ marginBottom: 8 }}>
      <p style={{ fontSize: 10, fontWeight: 600, color: '#5A6E94', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
        Share your prediction
      </p>
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={() => nativeShare(shareUrl, caption, match, prediction, setStatus)}
          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '9px 0', borderRadius: 10, fontSize: 13, fontWeight: 600, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.06)', color: '#E8F0FF', gap: 6 }}
        >
          {status === 'copied' ? '✓ Copied!' : '↑ Post'}
        </button>
        <a href={fbUrl} target="_blank" rel="noopener noreferrer" style={{ width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10, background: '#1877F2', flexShrink: 0 }}>
          <FBIcon />
        </a>
        <button onClick={async () => { await navigator.clipboard.writeText(caption); setStatus('copied'); setTimeout(() => setStatus('idle'), 2500); window.open('https://www.instagram.com/create/story', '_blank'); }} style={{ width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10, background: 'linear-gradient(45deg,#f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%)', flexShrink: 0 }}>
          <IGIcon />
        </button>
        <button onClick={async () => { await navigator.clipboard.writeText(caption); setStatus('copied'); setTimeout(() => setStatus('idle'), 2500); window.open('https://www.tiktok.com/upload', '_blank'); }} style={{ width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10, background: '#000', border: '1px solid rgba(255,255,255,0.12)', flexShrink: 0 }}>
          <TTIcon />
        </button>
      </div>
      {status === 'copied' && (
        <p style={{ textAlign: 'center', fontSize: 10, color: '#7A91BB', marginTop: 5 }}>Caption copied — paste it into your post!</p>
      )}
    </div>
  );
}

// ── Unsaved-changes guard dialog ──────────────────────────────────────────────

function UnsavedGuard({ onDiscard, onSave }: { onDiscard: () => void; onSave: () => void }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '0 24px',
      background: 'rgba(0,0,0,0.7)',
    }}>
      <div style={{
        width: '100%', maxWidth: 360,
        background: '#0E1535',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 18,
        padding: '22px 20px 18px',
        display: 'flex', flexDirection: 'column', gap: 18,
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>⚠️</div>
          <p style={{ fontSize: 15, fontWeight: 600, color: '#E8F0FF', lineHeight: 1.45, margin: 0 }}>
            You entered or changed the score of this match, do you want to save it?
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onDiscard}
            style={{
              flex: 1, padding: '12px 0', borderRadius: 12,
              fontSize: 14, fontWeight: 600,
              border: '1px solid rgba(255,255,255,0.12)',
              background: 'rgba(255,255,255,0.05)',
              color: '#7A91BB',
            }}
          >
            No, cancel
          </button>
          <button
            onClick={onSave}
            style={{
              flex: 1, padding: '12px 0', borderRadius: 12,
              fontSize: 14, fontWeight: 700,
              background: '#FF1F8E', color: '#fff', border: 'none',
            }}
          >
            Yes
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main modal ────────────────────────────────────────────────────────────────

interface PredictionModalProps {
  match: Match;
  userId: string;
  existing?: Prediction;
  open: boolean;
  onClose: () => void;
}

export function PredictionModal({ match, userId, existing, open, onClose }: PredictionModalProps) {
  const { setDraft, submitPrediction } = usePredictionsStore();

  const isFirstUse = !existing;
  const isLocked   = new Date(match.kickoffAt) <= new Date() || match.status !== 'upcoming';

  // ── Local prediction state ────────────────────────────────────────────────
  const [homeScore,  setHomeScore]  = useState<number | null>(existing?.homeScore  ?? null);
  const [awayScore,  setAwayScore]  = useState<number | null>(existing?.awayScore  ?? null);
  const [homePicks,  setHomePicks]  = useState<string[]>(existing?.homeScorerPicks ?? []);
  const [awayPicks,  setAwayPicks]  = useState<string[]>(existing?.awayScorerPicks ?? []);
  const [showGuard,  setShowGuard]  = useState(false);
  // 'predict' = normal view | 'share' = post-first-submit share screen
  const [phase,      setPhase]      = useState<'predict' | 'share'>('predict');
  // capture the saved prediction for the share screen (existing updates async)
  const [justSaved,  setJustSaved]  = useState<Prediction | null>(null);

  const hasRosters = !!(ROSTERS[match.homeTeam.id] || ROSTERS[match.awayTeam.id]);

  // Reset all local state whenever this match opens fresh
  useEffect(() => {
    if (open) {
      setHomeScore(existing?.homeScore  ?? null);
      setAwayScore(existing?.awayScore  ?? null);
      setHomePicks(existing?.homeScorerPicks ?? []);
      setAwayPicks(existing?.awayScorerPicks ?? []);
      setShowGuard(false);
      setPhase('predict');
      setJustSaved(null);
    }
  }, [open, match.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Derived state ─────────────────────────────────────────────────────────
  // Submit is enabled once both scores are set (not null)
  const canSubmit = homeScore !== null && awayScore !== null;

  // Guard triggers when score is dirty and user tries to close without saving.
  // First use: any score entered (both set). Return use: score differs from saved.
  const scoreDirty = !isLocked && (
    isFirstUse
      ? canSubmit
      : (homeScore !== existing!.homeScore || awayScore !== existing!.awayScore)
  );

  // ── Actions ───────────────────────────────────────────────────────────────
  function handleAttemptClose() {
    if (scoreDirty) {
      setShowGuard(true);
    } else {
      onClose();
    }
  }

  function handleSubmit() {
    if (homeScore === null || awayScore === null) return;
    // Push to draft store then commit
    setDraft(match.id, homeScore, awayScore, homePicks, awayPicks);
    const saved = submitPrediction(match.id, userId);
    if (isFirstUse) {
      setJustSaved(saved);
      setPhase('share');
    } else {
      onClose();
    }
  }

  function handleGuardSave() {
    setShowGuard(false);
    handleSubmit();
  }

  function handleGuardDiscard() {
    setShowGuard(false);
    onClose();
  }

  // ── Sticky footer composition ─────────────────────────────────────────────
  const stickyFooter = (() => {
    // Share phase: just "Done"
    if (phase === 'share') {
      return (
        <button
          onClick={onClose}
          style={{ width: '100%', padding: '14px 0', borderRadius: 14, fontSize: 15, fontWeight: 700, background: '#FF1F8E', color: '#fff', border: 'none' }}
        >
          Done
        </button>
      );
    }

    // Locked match — no editing, share if they have a prediction
    if (isLocked) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {existing && <CompactShareBar match={match} prediction={existing} userId={userId} />}
          <button
            onClick={onClose}
            style={{ width: '100%', padding: '12px 0', borderRadius: 12, fontSize: 14, fontWeight: 600, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.05)', color: '#7A91BB' }}
          >
            Close
          </button>
        </div>
      );
    }

    // First use: Cancel | Submit
    if (isFirstUse) {
      return (
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={handleAttemptClose}
            style={{ flex: 1, padding: '13px 0', borderRadius: 12, fontSize: 14, fontWeight: 600, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.05)', color: '#7A91BB' }}
          >
            Cancel
          </button>
          <button
            disabled={!canSubmit}
            onClick={handleSubmit}
            style={{
              flex: 2, padding: '13px 0', borderRadius: 12, fontSize: 14, fontWeight: 700,
              background: canSubmit ? '#FF1F8E' : 'rgba(255,31,142,0.18)',
              color: canSubmit ? '#fff' : 'rgba(255,255,255,0.28)',
              border: 'none',
              transition: 'background 0.2s, color 0.2s',
              cursor: canSubmit ? 'pointer' : 'default',
            }}
          >
            Submit Prediction
          </button>
        </div>
      );
    }

    // Return user: compact share bar + Cancel | Save
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        <CompactShareBar match={match} prediction={existing!} userId={userId} />
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={handleAttemptClose}
            style={{ flex: 1, padding: '12px 0', borderRadius: 12, fontSize: 14, fontWeight: 600, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.05)', color: '#7A91BB' }}
          >
            Cancel
          </button>
          <button
            disabled={!scoreDirty}
            onClick={handleSubmit}
            style={{
              flex: 2, padding: '12px 0', borderRadius: 12, fontSize: 14, fontWeight: 700,
              background: scoreDirty ? '#FF1F8E' : 'rgba(255,31,142,0.18)',
              color: scoreDirty ? '#fff' : 'rgba(255,255,255,0.28)',
              border: 'none',
              transition: 'background 0.2s, color 0.2s',
              cursor: scoreDirty ? 'pointer' : 'default',
            }}
          >
            Save
          </button>
        </div>
      </div>
    );
  })();

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <Modal open={open} onClose={handleAttemptClose} footer={stickyFooter}>

        {/* ── Share phase (post first-submit) ── */}
        {phase === 'share' && justSaved && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, paddingBottom: 4 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 44, marginBottom: 10, lineHeight: 1 }}>⚽</div>
              <h2 style={{
                fontFamily: 'var(--font-barlow-condensed)',
                fontSize: 22, fontWeight: 900, color: '#E8F0FF',
                textTransform: 'uppercase', letterSpacing: '0.04em',
                lineHeight: 1.2, margin: 0, marginBottom: 4,
              }}>
                Let&apos;s settle the score
              </h2>
              <p style={{ fontSize: 14, color: '#7A91BB', margin: 0 }}>
                Share your prediction on the socials
              </p>
            </div>
            {/* Prediction recap */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 14, padding: '14px 20px',
              width: '100%',
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, flex: 1 }}>
                <FlagImage code={match.homeTeam.code} size={32} className="rounded-sm" />
                <span style={{ fontSize: 11, fontWeight: 700, color: '#E8F0FF', textAlign: 'center' }}>{match.homeTeam.code}</span>
              </div>
              <span style={{ fontFamily: 'var(--font-barlow-condensed)', fontSize: 32, fontWeight: 900, color: '#FF1F8E' }}>
                {justSaved.homeScore}&nbsp;–&nbsp;{justSaved.awayScore}
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, flex: 1 }}>
                <FlagImage code={match.awayTeam.code} size={32} className="rounded-sm" />
                <span style={{ fontSize: 11, fontWeight: 700, color: '#E8F0FF', textAlign: 'center' }}>{match.awayTeam.code}</span>
              </div>
            </div>
            <SharePanel match={match} prediction={justSaved} userId={userId} />
          </div>
        )}

        {/* ── Predict phase ── */}
        {phase === 'predict' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 4 }}>
            <h1
              className="text-2xl font-black text-center"
              style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#E8F0FF', textTransform: 'uppercase', letterSpacing: '0.02em', margin: 0 }}
            >
              Predictions
            </h1>

            {/* Face-off */}
            <TeamFaceOff match={match} />

            {/* Score steppers — only when unlocked */}
            {!isLocked && (
              <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <p className="mb-3 text-xs font-semibold text-center" style={{ color: '#7A91BB' }}>Predict the score</p>
                <div className="flex items-center justify-center gap-4">
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontSize: 10, fontWeight: 600, color: '#5A6E94' }}>{match.homeTeam.code}</span>
                    <ScoreStepper
                      value={homeScore}
                      onChange={v => setHomeScore(v)}
                      locked={isLocked}
                    />
                  </div>
                  <span style={{ fontSize: 22, fontWeight: 900, color: '#3A4E6E', fontFamily: 'var(--font-barlow-condensed)' }}>–</span>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontSize: 10, fontWeight: 600, color: '#5A6E94' }}>{match.awayTeam.code}</span>
                    <ScoreStepper
                      value={awayScore}
                      onChange={v => setAwayScore(v)}
                      locked={isLocked}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Results card — match finished */}
            {isLocked && existing && match.status === 'finished' && match.homeScore !== null && (() => {
              const gradingScore = getGradingScore(match);
              if (!gradingScore) return null;
              const pts = calcPoints(existing, { homeScore: gradingScore.homeScore, awayScore: gradingScore.awayScore });
              const ptColor = pts >= 3 ? '#FFB020' : pts > 0 ? '#00C44F' : pts < 0 ? '#FF4D4D' : '#7A91BB';
              const ptLabel = pts >= 6 ? `🌟 +${pts} pts` : pts >= 3 ? `⭐ +${pts} pts` : pts > 0 ? `✓ +${pts} pts` : pts < 0 ? `✗ ${pts} pts` : '✗ 0 pts';
              return (
                <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div className="flex items-center justify-between px-4 py-3" style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#7A91BB' }}>Final Score</span>
                    <span className="text-2xl font-black" style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#E8F0FF' }}>{match.homeScore} – {match.awayScore}</span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-3" style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#7A91BB' }}>Your Prediction</span>
                    <span className="text-2xl font-black" style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#E8F0FF' }}>{existing.homeScore} – {existing.awayScore}</span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-3" style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#7A91BB' }}>Points Earned</span>
                    <span className="text-2xl font-black" style={{ fontFamily: 'var(--font-barlow-condensed)', color: ptColor }}>{ptLabel}</span>
                  </div>
                </div>
              );
            })()}

            {/* In-progress display */}
            {isLocked && existing && match.status !== 'finished' && (
              <div className="text-center">
                <span className="text-2xl font-black" style={{ color: '#E8F0FF', fontFamily: 'var(--font-barlow-condensed)' }}>
                  {existing.homeScore} – {existing.awayScore}
                </span>
                <p className="text-xs mt-0.5" style={{ color: '#7A91BB' }}>Your prediction</p>
              </div>
            )}

            {/* Locked: no prediction yet */}
            {isLocked && !existing && (
              <p className="text-center text-sm" style={{ color: '#5A6E94' }}>No prediction was submitted before kickoff.</p>
            )}

            {/* Scorer picks */}
            {!isLocked && hasRosters && (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <h3 className="text-sm font-bold" style={{ color: '#E8F0FF' }}>Who will score? Choose up to 2 per team</h3>
                  <p className="text-[11px]" style={{ color: '#7A91BB' }}>
                    <span className="font-bold" style={{ color: '#00C44F' }}>+2 pts</span> for each correct,{' '}
                    <span className="font-bold" style={{ color: '#FF4D4D' }}>−1 pt</span> for each incorrect
                  </p>
                </div>
                <SideBySidePicker
                  match={match}
                  homePicks={homePicks} onHomePicks={setHomePicks}
                  awayPicks={awayPicks} onAwayPicks={setAwayPicks}
                  locked={isLocked}
                />
              </>
            )}

            {/* Locked scorer display */}
            {isLocked && existing && (existing.homeScorerPicks?.length > 0 || existing.awayScorerPicks?.length > 0) && (
              <div className="rounded-xl p-3 space-y-2" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <p className="text-xs font-semibold" style={{ color: '#E8F0FF' }}>Your scorer picks</p>
                {existing.homeScorerPicks?.length > 0 && (
                  <div>
                    <span className="text-[10px] mr-1" style={{ color: '#7A91BB' }}>{match.homeTeam.name}:</span>
                    {existing.homeScorerPicks.map(p => <span key={p} className="mr-1 text-[11px] font-semibold" style={{ color: '#E8F0FF' }}>{p}</span>)}
                  </div>
                )}
                {existing.awayScorerPicks?.length > 0 && (
                  <div>
                    <span className="text-[10px] mr-1" style={{ color: '#7A91BB' }}>{match.awayTeam.name}:</span>
                    {existing.awayScorerPicks.map(p => <span key={p} className="mr-1 text-[11px] font-semibold" style={{ color: '#E8F0FF' }}>{p}</span>)}
                  </div>
                )}
              </div>
            )}

            {isLocked && (
              <p className="text-center text-xs" style={{ color: '#5A6E94' }}>Predictions locked — match has started</p>
            )}
          </div>
        )}
      </Modal>

      {/* Unsaved-changes guard dialog (renders above the modal) */}
      {showGuard && (
        <UnsavedGuard onDiscard={handleGuardDiscard} onSave={handleGuardSave} />
      )}
    </>
  );
}
