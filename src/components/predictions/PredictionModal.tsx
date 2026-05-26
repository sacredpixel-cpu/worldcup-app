'use client';

import { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { FlagImage } from '@/components/ui/FlagImage';
import { usePredictionsStore } from '@/store';
import { ROSTERS } from '@/data/rosters';
import type { TeamHistory } from '@/data/rosters';
import type { Match } from '@/types/match';
import type { Prediction } from '@/types/prediction';

// ── Score stepper ────────────────────────────────────────────────────────────

function ScoreStepper({ value, onChange, locked }: { value: number; onChange: (v: number) => void; locked: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <button
        disabled={locked || value <= 0}
        onClick={() => onChange(value - 1)}
        className="flex h-9 w-9 items-center justify-center rounded-xl text-lg font-bold disabled:opacity-30 active:scale-90"
        style={{ border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.06)', color: '#E8F0FF' }}
      >−</button>
      <span className="w-7 text-center text-2xl font-black" style={{ color: '#E8F0FF', fontFamily: 'var(--font-barlow-condensed)' }}>{value}</span>
      <button
        disabled={locked || value >= 10}
        onClick={() => onChange(value + 1)}
        className="flex h-9 w-9 items-center justify-center rounded-xl text-lg font-bold disabled:opacity-30 active:scale-90"
        style={{ border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.06)', color: '#E8F0FF' }}
      >+</button>
    </div>
  );
}

// ── Country name abbreviator (display only) ──────────────────────────────────

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

// ── Team face-off panel (flags, coaches, history stats only) ─────────────────

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

      {/* Flags + names + coaches */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', gap: 16, padding: '14px 10px 10px' }}>
        {/* Home – center aligned */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 52, height: 52, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', border: '1.5px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
            <FlagImage code={match.homeTeam.code} size={36} className="rounded-sm" />
          </div>
          <span style={{ fontSize: 24, fontWeight: 900, color: '#E8F0FF', lineHeight: 1.1, textAlign: 'center', fontFamily: 'var(--font-barlow-condensed)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{abbrevCountry(match.homeTeam.name)}</span>
          {homeRoster?.nickname && (
            <span style={{ fontSize: 13, color: '#7A91BB', fontStyle: 'italic', textAlign: 'center' }}>"{homeRoster.nickname}"</span>
          )}
          {homeRoster?.coach && (
            <span style={{ fontSize: 12, color: '#6A82A8', textAlign: 'center' }}>{homeRoster.coach}</span>
          )}
        </div>

        {/* VS */}
        <div style={{ display: 'flex', alignItems: 'center', paddingTop: 14, flexShrink: 0 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#3A4E6E', letterSpacing: '0.06em' }}>VS</span>
        </div>

        {/* Away – center aligned */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 52, height: 52, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', border: '1.5px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
            <FlagImage code={match.awayTeam.code} size={36} className="rounded-sm" />
          </div>
          <span style={{ fontSize: 24, fontWeight: 900, color: '#E8F0FF', lineHeight: 1.1, textAlign: 'center', fontFamily: 'var(--font-barlow-condensed)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{abbrevCountry(match.awayTeam.name)}</span>
          {awayRoster?.nickname && (
            <span style={{ fontSize: 13, color: '#7A91BB', fontStyle: 'italic', textAlign: 'center' }}>"{awayRoster.nickname}"</span>
          )}
          {awayRoster?.coach && (
            <span style={{ fontSize: 12, color: '#6A82A8', textAlign: 'center' }}>{awayRoster.coach}</span>
          )}
        </div>
      </div>

      {/* Stats face-off */}
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

// ── Side-by-side scorer picker ────────────────────────────────────────────────

type Position = 'forwards' | 'midfielders' | 'defenders' | 'goalkeepers';
const POS_LABELS: Record<Position, string> = {
  forwards:    'FWD',
  midfielders: 'MID',
  defenders:   'DEF',
  goalkeepers: 'GK',
};
const POSITIONS: Position[] = ['forwards', 'midfielders', 'defenders', 'goalkeepers'];

function SideBySidePicker({
  match,
  homePicks, onHomePicks,
  awayPicks, onAwayPicks,
  locked,
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
    if (picks.includes(name)) {
      onChange(picks.filter(p => p !== name));
    } else if (picks.length < 2) {
      onChange([...picks, name]);
    }
  }

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)' }}>
      {/* Column headers with pick counts */}
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

      {/* Player columns */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
        {/* Home – left */}
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
                    <button
                      key={name}
                      disabled={locked || maxed}
                      onClick={() => toggle(homePicks, onHomePicks, name)}
                      style={{
                        display: 'block', width: '100%', textAlign: 'left',
                        padding: '6px 10px', fontSize: 12, lineHeight: 1.4,
                        fontWeight: selected ? 700 : 400,
                        color: selected ? '#00C44F' : maxed ? 'rgba(154,174,212,0.3)' : '#9AAED4',
                        background: selected ? 'rgba(0,196,79,0.08)' : 'transparent',
                        borderLeft: selected ? '2px solid #00C44F' : '2px solid transparent',
                        cursor: locked || maxed ? 'default' : 'pointer',
                        WebkitTapHighlightColor: 'transparent',
                      }}
                    >
                      {name}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Away – right */}
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
                    <button
                      key={name}
                      disabled={locked || maxed}
                      onClick={() => toggle(awayPicks, onAwayPicks, name)}
                      style={{
                        display: 'block', width: '100%', textAlign: 'right',
                        padding: '6px 10px', fontSize: 12, lineHeight: 1.4,
                        fontWeight: selected ? 700 : 400,
                        color: selected ? '#FF4DA8' : maxed ? 'rgba(154,174,212,0.3)' : '#9AAED4',
                        background: selected ? 'rgba(255,77,168,0.08)' : 'transparent',
                        borderRight: selected ? '2px solid #FF4DA8' : '2px solid transparent',
                        cursor: locked || maxed ? 'default' : 'pointer',
                        WebkitTapHighlightColor: 'transparent',
                      }}
                    >
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

// ── Share panel ──────────────────────────────────────────────────────────────

function SharePanel({ match, prediction, userId }: { match: Match; prediction: Prediction; userId: string }) {
  const [status, setStatus] = useState<'idle' | 'copied'>('idle');

  const shareUrl = `https://myworldcupschedule.com/share/${match.id}/${userId}?h=${prediction.homeScore}&a=${prediction.awayScore}`;
  const caption = `I'm predicting ${match.homeTeam.name} ${prediction.homeScore}–${prediction.awayScore} ${match.awayTeam.name} at the 2026 FIFA World Cup! Can you do better?\n\n${shareUrl}`;
  const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;

  async function handleShare() {
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

  async function handleInstagram() {
    await navigator.clipboard.writeText(caption);
    setStatus('copied');
    setTimeout(() => setStatus('idle'), 2500);
    window.open('https://www.instagram.com/create/story', '_blank');
  }

  async function handleTikTok() {
    await navigator.clipboard.writeText(caption);
    setStatus('copied');
    setTimeout(() => setStatus('idle'), 2500);
    window.open('https://www.tiktok.com/upload', '_blank');
  }

  return (
    <div className="rounded-xl p-3 space-y-2" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <p className="text-xs font-semibold" style={{ color: '#7A91BB' }}>Share your prediction</p>
      <div className="flex gap-2">
        {/* Native share / copy */}
        <button
          onClick={handleShare}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold active:scale-95"
          style={{ border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.06)', color: '#E8F0FF' }}
        >
          {status === 'copied' ? '✓ Copied!' : '↑ Post'}
        </button>
        {/* Facebook */}
        <a
          href={fbUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-9 w-9 items-center justify-center rounded-lg active:scale-95 flex-shrink-0"
          style={{ background: '#1877F2' }}
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4 fill-white">
            <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.791-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
          </svg>
        </a>
        {/* Instagram */}
        <button
          onClick={handleInstagram}
          className="flex h-9 w-9 items-center justify-center rounded-lg active:scale-95 flex-shrink-0"
          style={{ background: 'linear-gradient(45deg,#f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%)' }}
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4 fill-white">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
          </svg>
        </button>
        {/* TikTok */}
        <button
          onClick={handleTikTok}
          className="flex h-9 w-9 items-center justify-center rounded-lg active:scale-95 flex-shrink-0"
          style={{ background: '#000', border: '1px solid rgba(255,255,255,0.12)' }}
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4 fill-white">
            <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.79 1.53V6.77a4.85 4.85 0 01-1.02-.08z"/>
          </svg>
        </button>
      </div>
      {status === 'copied' && (
        <p className="text-center text-[10px]" style={{ color: '#7A91BB' }}>Caption copied — paste it into your post!</p>
      )}
    </div>
  );
}

// ── Main modal ───────────────────────────────────────────────────────────────

interface PredictionModalProps {
  match: Match;
  userId: string;
  existing?: Prediction;
  open: boolean;
  onClose: () => void;
}

export function PredictionModal({ match, userId, existing, open, onClose }: PredictionModalProps) {
  const { draft, setDraft, submitPrediction } = usePredictionsStore();
  const isLocked = new Date(match.kickoffAt) <= new Date() || match.status !== 'upcoming';

  const d = draft[match.id];
  const homeScore = d?.homeScore ?? existing?.homeScore ?? 0;
  const awayScore = d?.awayScore ?? existing?.awayScore ?? 0;
  const homePicks = d?.homeScorerPicks ?? existing?.homeScorerPicks ?? [];
  const awayPicks = d?.awayScorerPicks ?? existing?.awayScorerPicks ?? [];

  const isDirty = d !== undefined;
  const hasRosters = !!(ROSTERS[match.homeTeam.id] || ROSTERS[match.awayTeam.id]);

  useEffect(() => {
    if (open && existing && !d) {
      setDraft(match.id, existing.homeScore, existing.awayScore, existing.homeScorerPicks, existing.awayScorerPicks);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleSubmit() {
    submitPrediction(match.id, userId);
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} className="max-h-[90vh] overflow-y-auto">
      <h1 className="mb-3 text-2xl font-black text-center" style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#E8F0FF', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Predictions</h1>

      <div className="space-y-4">
        {/* 1. Face-off: flags, coaches, tournament history */}
        <TeamFaceOff match={match} />

        {/* 2. Score prediction */}
        {!isLocked && (
          <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <p className="mb-3 text-xs font-semibold text-center" style={{ color: '#7A91BB' }}>Predict the score</p>
            <div className="flex items-center justify-center gap-4">
              <ScoreStepper value={homeScore} onChange={(v) => setDraft(match.id, v, awayScore, homePicks, awayPicks)} locked={isLocked} />
              <span className="text-xl font-black" style={{ color: '#3A4E6E' }}>–</span>
              <ScoreStepper value={awayScore} onChange={(v) => setDraft(match.id, homeScore, v, homePicks, awayPicks)} locked={isLocked} />
            </div>
          </div>
        )}

        {isLocked && existing && (
          <div className="text-center">
            <span className="text-2xl font-black" style={{ color: '#E8F0FF', fontFamily: 'var(--font-barlow-condensed)' }}>
              {existing.homeScore} – {existing.awayScore}
            </span>
            <p className="text-xs mt-0.5" style={{ color: '#7A91BB' }}>Your prediction</p>
          </div>
        )}

        {/* 3. Scorer picks — side by side */}
        {!isLocked && hasRosters && (
          <>
            <div className="space-y-1">
              <h3 className="text-sm font-bold" style={{ color: '#E8F0FF' }}>Who will score? Choose up to 2 players from each team</h3>
              <p className="text-[11px]" style={{ color: '#7A91BB' }}>
                <span className="font-bold" style={{ color: '#00C44F' }}>+1 pt</span> for each correct choice,{' '}
                <span className="font-bold" style={{ color: '#FF4D4D' }}>-1 pt</span> for each incorrect choice
              </p>
            </div>
            <SideBySidePicker
              match={match}
              homePicks={homePicks} onHomePicks={(p) => setDraft(match.id, homeScore, awayScore, p, awayPicks)}
              awayPicks={awayPicks} onAwayPicks={(p) => setDraft(match.id, homeScore, awayScore, homePicks, p)}
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
                {existing.homeScorerPicks.map(p => (
                  <span key={p} className="mr-1 text-[11px] font-semibold" style={{ color: '#E8F0FF' }}>{p}</span>
                ))}
              </div>
            )}
            {existing.awayScorerPicks?.length > 0 && (
              <div>
                <span className="text-[10px] mr-1" style={{ color: '#7A91BB' }}>{match.awayTeam.name}:</span>
                {existing.awayScorerPicks.map(p => (
                  <span key={p} className="mr-1 text-[11px] font-semibold" style={{ color: '#E8F0FF' }}>{p}</span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Submit */}
        {!isLocked && isDirty && (
          <button
            onClick={handleSubmit}
            className="w-full rounded-xl bg-brand py-3 text-sm font-bold text-gray-900 active:scale-95"
          >
            Submit Prediction
          </button>
        )}

        {isLocked && (
          <p className="text-center text-xs" style={{ color: '#7A91BB' }}>Predictions locked — match has started</p>
        )}

        {/* Share — visible whenever the user has a saved prediction */}
        {existing && (
          <SharePanel match={match} prediction={existing} userId={userId} />
        )}

        <button
          onClick={onClose}
          className="w-full rounded-xl py-3 text-sm font-semibold active:scale-95 transition-colors"
          style={{ border: '1px solid rgba(255,255,255,0.12)', color: '#7A91BB' }}
        >
          Cancel
        </button>
      </div>
    </Modal>
  );
}
