'use client';

import { useEffect } from 'react';
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

// ── Team face-off panel (flags, coaches, history stats only) ─────────────────

const STAT_ROWS: { label: string; key: keyof TeamHistory }[] = [
  { label: 'World Cup apps',  key: 'appearances' },
  { label: 'Group stage',     key: 'passed_group_stage' },
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
        {/* Home – left */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 52, height: 52, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', border: '1.5px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
            <FlagImage code={match.homeTeam.code} size={36} className="rounded-sm" />
          </div>
          <span style={{ fontSize: 24, fontWeight: 900, color: '#E8F0FF', lineHeight: 1.1, fontFamily: 'var(--font-barlow-condensed)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{match.homeTeam.name}</span>
          {homeRoster?.nickname && (
            <span style={{ fontSize: 13, color: '#7A91BB', fontStyle: 'italic' }}>"{homeRoster.nickname}"</span>
          )}
          {homeRoster?.coach && (
            <span style={{ fontSize: 12, color: '#6A82A8' }}>🧑‍💼 {homeRoster.coach}</span>
          )}
        </div>

        {/* VS */}
        <div style={{ display: 'flex', alignItems: 'center', paddingTop: 14, flexShrink: 0 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#3A4E6E', letterSpacing: '0.06em' }}>VS</span>
        </div>

        {/* Away – right */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 52, height: 52, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', border: '1.5px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
            <FlagImage code={match.awayTeam.code} size={36} className="rounded-sm" />
          </div>
          <span style={{ fontSize: 24, fontWeight: 900, color: '#E8F0FF', lineHeight: 1.1, textAlign: 'right', fontFamily: 'var(--font-barlow-condensed)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{match.awayTeam.name}</span>
          {awayRoster?.nickname && (
            <span style={{ fontSize: 13, color: '#7A91BB', fontStyle: 'italic', textAlign: 'right' }}>"{awayRoster.nickname}"</span>
          )}
          {awayRoster?.coach && (
            <span style={{ fontSize: 12, color: '#6A82A8', textAlign: 'right' }}>{awayRoster.coach} 🧑‍💼</span>
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
      {/* Close button */}
      <div className="flex justify-end mb-2">
        <button
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-full active:scale-90 transition-colors"
          style={{ border: '1px solid rgba(255,255,255,0.15)', color: '#7A91BB' }}
          aria-label="Close"
        >
          <span className="text-base font-bold leading-none">✕</span>
        </button>
      </div>

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
