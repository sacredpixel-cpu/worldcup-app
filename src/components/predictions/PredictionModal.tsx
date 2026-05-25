'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { FlagImage } from '@/components/ui/FlagImage';
import { usePredictionsStore } from '@/store';
import { ROSTERS } from '@/data/rosters';
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

// ── Team history stats ───────────────────────────────────────────────────────

function HistoryBar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = max === 0 ? 0 : Math.round((value / max) * 100);
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-28 shrink-0" style={{ color: '#7A91BB' }}>{label}</span>
      <div className="flex-1 rounded-full h-1.5" style={{ background: 'rgba(255,255,255,0.08)' }}>
        <div className="h-1.5 rounded-full bg-brand" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-5 text-right font-semibold" style={{ color: '#E8F0FF' }}>{value}</span>
    </div>
  );
}

function TeamInfo({ teamId, teamName }: { teamId: string; teamName: string }) {
  const roster = ROSTERS[teamId];
  if (!roster) return null;
  const h = roster.history;
  return (
    <div className="rounded-xl p-3 space-y-1.5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-bold" style={{ color: '#E8F0FF' }}>{teamName}</span>
          {roster.nickname && (
            <span className="ml-1.5 text-[10px] italic" style={{ color: '#7A91BB' }}>"{roster.nickname}"</span>
          )}
        </div>
        <span className="text-[10px]" style={{ color: '#7A91BB' }}>Coach: {roster.coach}</span>
      </div>
      <HistoryBar label="World Cup apps" value={h.appearances} max={23} />
      <HistoryBar label="Group stage" value={h.passed_group_stage} max={h.appearances || 1} />
      <HistoryBar label="Quarter-finals" value={h.quarter_finals} max={h.appearances || 1} />
      <HistoryBar label="Semi-finals" value={h.semi_finals} max={h.appearances || 1} />
      <HistoryBar label="Finals" value={h.finals} max={h.appearances || 1} />
      <HistoryBar label="Wins" value={h.wins} max={h.appearances || 1} />
    </div>
  );
}

// ── Player picker ────────────────────────────────────────────────────────────

type Position = 'goalkeepers' | 'defenders' | 'midfielders' | 'forwards';
const POSITION_LABELS: Record<Position, string> = {
  goalkeepers: 'GK',
  defenders: 'DEF',
  midfielders: 'MID',
  forwards: 'FWD',
};

function PlayerPicker({
  teamId,
  teamName,
  picks,
  onChange,
  locked,
  side,
}: {
  teamId: string;
  teamName: string;
  picks: string[];
  onChange: (picks: string[]) => void;
  locked: boolean;
  side: 'home' | 'away';
}) {
  const roster = ROSTERS[teamId];
  const [openPos, setOpenPos] = useState<Position | null>('forwards');

  if (!roster) return null;

  function toggle(name: string) {
    if (locked) return;
    if (picks.includes(name)) {
      onChange(picks.filter(p => p !== name));
    } else if (picks.length < 2) {
      onChange([...picks, name]);
    }
  }

  const positions: Position[] = ['forwards', 'midfielders', 'defenders', 'goalkeepers'];

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold" style={{ color: '#E8F0FF' }}>{teamName} scorer picks</span>
        <span className="text-[10px] font-medium" style={{ color: '#7A91BB' }}>{picks.length}/2 selected</span>
      </div>
      {picks.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-1">
          {picks.map(p => (
            <span key={p} className={`rounded-full px-2 py-0.5 text-[11px] font-semibold text-white ${side === 'home' ? 'bg-green-600' : 'bg-pink-600'}`}>
              {p}
            </span>
          ))}
        </div>
      )}
      {positions.map(pos => {
        const players = roster.squad[pos];
        if (!players.length) return null;
        const isOpen = openPos === pos;
        return (
          <div key={pos} className="rounded-lg overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
            <button
              className="flex w-full items-center justify-between px-3 py-2 text-xs font-bold"
              style={{ background: 'rgba(255,255,255,0.06)', color: '#E8F0FF' }}
              onClick={() => setOpenPos(isOpen ? null : pos)}
            >
              <span>{POSITION_LABELS[pos]}</span>
              <span style={{ color: '#7A91BB' }}>{isOpen ? '▲' : '▼'}</span>
            </button>
            {isOpen && (
              <div className="flex flex-wrap gap-1.5 p-2" style={{ background: 'rgba(255,255,255,0.02)' }}>
                {players.map(name => {
                  const selected = picks.includes(name);
                  const maxed = picks.length >= 2 && !selected;
                  return (
                    <button
                      key={name}
                      disabled={locked || maxed}
                      onClick={() => toggle(name)}
                      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold text-white transition-colors active:scale-95 ${
                        selected
                          ? side === 'home' ? 'bg-green-700' : 'bg-pink-700'
                          : maxed
                          ? 'opacity-30 cursor-not-allowed ' + (side === 'home' ? 'bg-green-600' : 'bg-pink-600')
                          : side === 'home'
                          ? 'bg-green-600 hover:bg-green-500'
                          : 'bg-pink-600 hover:bg-pink-500'
                      }`}
                    >
                      {name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
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

  useEffect(() => {
    if (open && existing && !d) {
      setDraft(match.id, existing.homeScore, existing.awayScore, existing.homeScorerPicks, existing.awayScorerPicks);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleSubmit() {
    submitPrediction(match.id, userId);
    onClose();
  }

  const homeRoster = ROSTERS[match.homeTeam.id];
  const awayRoster = ROSTERS[match.awayTeam.id];

  return (
    <Modal open={open} onClose={onClose} className="max-h-[90vh] overflow-y-auto">
      {/* X close button */}
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

      {/* H1 headline */}
      <h1 className="mb-3 text-3xl font-black" style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#E8F0FF' }}>Predictions</h1>

      {/* Match header */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex flex-1 flex-col items-center gap-0.5">
          <FlagImage code={match.homeTeam.code} size={44} />
          <span className="text-xs font-bold text-center leading-tight" style={{ color: '#E8F0FF' }}>{match.homeTeam.name}</span>
          {ROSTERS[match.homeTeam.id]?.nickname && (
            <span className="text-[10px] text-center leading-tight" style={{ color: '#7A91BB' }}>{ROSTERS[match.homeTeam.id].nickname}</span>
          )}
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="text-xs font-semibold" style={{ color: '#5A6E94' }}>VS</span>
          {isLocked && existing && (
            <span className="text-sm font-black" style={{ color: '#E8F0FF', fontFamily: 'var(--font-barlow-condensed)' }}>{existing.homeScore}–{existing.awayScore}</span>
          )}
        </div>
        <div className="flex flex-1 flex-col items-center gap-0.5">
          <FlagImage code={match.awayTeam.code} size={44} />
          <span className="text-xs font-bold text-center leading-tight" style={{ color: '#E8F0FF' }}>{match.awayTeam.name}</span>
          {ROSTERS[match.awayTeam.id]?.nickname && (
            <span className="text-[10px] text-center leading-tight" style={{ color: '#7A91BB' }}>{ROSTERS[match.awayTeam.id].nickname}</span>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {/* Score prediction */}
        {!isLocked && (
          <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <p className="mb-3 text-xs font-semibold text-center" style={{ color: '#7A91BB' }}>Predict the score</p>
            <div className="flex items-center justify-center gap-4">
              <ScoreStepper
                value={homeScore}
                onChange={(v) => setDraft(match.id, v, awayScore, homePicks, awayPicks)}
                locked={isLocked}
              />
              <span className="text-xl font-black" style={{ color: '#3A4E6E' }}>–</span>
              <ScoreStepper
                value={awayScore}
                onChange={(v) => setDraft(match.id, homeScore, v, homePicks, awayPicks)}
                locked={isLocked}
              />
            </div>
          </div>
        )}

        {/* Scorer picks */}
        {!isLocked && (homeRoster || awayRoster) && (
          <div className="space-y-3">
            <div className="text-center space-y-1">
              <h3 className="text-sm font-bold" style={{ color: '#E8F0FF' }}>Who will score? Choose up to 2 players from each team</h3>
              <p className="text-[11px]" style={{ color: '#7A91BB' }}>
                <span className="font-bold" style={{ color: '#00C44F' }}>+1 pt</span> for each correct choice,{' '}
                <span className="font-bold" style={{ color: '#FF4D4D' }}>-1 pt</span> subtracted for each incorrect choice
              </p>
            </div>
            {homeRoster && (
              <PlayerPicker
                teamId={match.homeTeam.id}
                teamName={match.homeTeam.name}
                picks={homePicks}
                onChange={(p) => setDraft(match.id, homeScore, awayScore, p, awayPicks)}
                locked={isLocked}
                side="home"
              />
            )}
            {awayRoster && (
              <PlayerPicker
                teamId={match.awayTeam.id}
                teamName={match.awayTeam.name}
                picks={awayPicks}
                onChange={(p) => setDraft(match.id, homeScore, awayScore, homePicks, p)}
                locked={isLocked}
                side="away"
              />
            )}
          </div>
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

        {/* Team info */}
        <div className="space-y-2">
          <p className="text-xs font-semibold" style={{ color: '#E8F0FF' }}>Team info</p>
          <TeamInfo teamId={match.homeTeam.id} teamName={match.homeTeam.name} />
          <TeamInfo teamId={match.awayTeam.id} teamName={match.awayTeam.name} />
        </div>

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

        {/* Bottom cancel button */}
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
