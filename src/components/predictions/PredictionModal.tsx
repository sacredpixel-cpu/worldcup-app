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
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card text-lg font-bold text-gray-900 disabled:opacity-30 active:scale-90"
      >−</button>
      <span className="w-7 text-center text-2xl font-black text-gray-900">{value}</span>
      <button
        disabled={locked || value >= 10}
        onClick={() => onChange(value + 1)}
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card text-lg font-bold text-gray-900 disabled:opacity-30 active:scale-90"
      >+</button>
    </div>
  );
}

// ── Team history stats ───────────────────────────────────────────────────────

function HistoryBar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = max === 0 ? 0 : Math.round((value / max) * 100);
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-28 shrink-0 text-gray-400">{label}</span>
      <div className="flex-1 rounded-full bg-white/10 h-1.5">
        <div className="h-1.5 rounded-full bg-brand" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-5 text-right font-semibold text-gray-300">{value}</span>
    </div>
  );
}

function TeamInfo({ teamId, teamName }: { teamId: string; teamName: string }) {
  const roster = ROSTERS[teamId];
  if (!roster) return null;
  const h = roster.history;
  return (
    <div className="rounded-xl border border-border bg-card/50 p-3 space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-gray-200">{teamName}</span>
        <span className="text-[10px] text-gray-400">Coach: {roster.coach}</span>
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
}: {
  teamId: string;
  teamName: string;
  picks: string[];
  onChange: (picks: string[]) => void;
  locked: boolean;
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
        <span className="text-xs font-semibold text-gray-300">{teamName} scorer picks</span>
        <span className="text-[10px] text-gray-500">{picks.length}/2 selected</span>
      </div>
      {picks.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-1">
          {picks.map(p => (
            <span key={p} className="rounded-full bg-brand/20 border border-brand/40 px-2 py-0.5 text-[11px] font-semibold text-brand-light">
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
          <div key={pos} className="rounded-lg border border-border overflow-hidden">
            <button
              className="flex w-full items-center justify-between px-3 py-2 bg-card/60 text-xs font-semibold text-gray-300"
              onClick={() => setOpenPos(isOpen ? null : pos)}
            >
              <span>{POSITION_LABELS[pos]}</span>
              <span className="text-gray-500">{isOpen ? '▲' : '▼'}</span>
            </button>
            {isOpen && (
              <div className="flex flex-wrap gap-1.5 p-2 bg-card/30">
                {players.map(name => {
                  const selected = picks.includes(name);
                  const maxed = picks.length >= 2 && !selected;
                  return (
                    <button
                      key={name}
                      disabled={locked || maxed}
                      onClick={() => toggle(name)}
                      className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
                        selected
                          ? 'bg-brand text-gray-900'
                          : maxed
                          ? 'bg-white/5 text-gray-600 cursor-not-allowed'
                          : 'bg-white/10 text-gray-200 hover:bg-white/20 active:scale-95'
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

  // When opening in edit mode, seed draft from existing
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
      {/* Match header */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex flex-1 flex-col items-center gap-1">
          <FlagImage code={match.homeTeam.code} size={44} />
          <span className="text-xs font-bold text-gray-900 text-center leading-tight">{match.homeTeam.name}</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="text-xs text-gray-400 font-semibold">VS</span>
          {isLocked && existing && (
            <span className="text-sm font-black text-gray-900">{existing.homeScore}–{existing.awayScore}</span>
          )}
        </div>
        <div className="flex flex-1 flex-col items-center gap-1">
          <FlagImage code={match.awayTeam.code} size={44} />
          <span className="text-xs font-bold text-gray-900 text-center leading-tight">{match.awayTeam.name}</span>
        </div>
      </div>

      <div className="space-y-4">
        {/* Score prediction */}
        {!isLocked && (
          <div className="rounded-xl border border-border bg-card/50 p-3">
            <p className="mb-3 text-xs font-semibold text-gray-400 text-center">Predict the score</p>
            <div className="flex items-center justify-center gap-4">
              <ScoreStepper
                value={homeScore}
                onChange={(v) => setDraft(match.id, v, awayScore, homePicks, awayPicks)}
                locked={isLocked}
              />
              <span className="text-xl font-black text-gray-500">–</span>
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
            <p className="text-xs font-semibold text-gray-400 text-center">Pick up to 2 goal scorers per team</p>
            {homeRoster && (
              <PlayerPicker
                teamId={match.homeTeam.id}
                teamName={match.homeTeam.name}
                picks={homePicks}
                onChange={(p) => setDraft(match.id, homeScore, awayScore, p, awayPicks)}
                locked={isLocked}
              />
            )}
            {awayRoster && (
              <PlayerPicker
                teamId={match.awayTeam.id}
                teamName={match.awayTeam.name}
                picks={awayPicks}
                onChange={(p) => setDraft(match.id, homeScore, awayScore, homePicks, p)}
                locked={isLocked}
              />
            )}
          </div>
        )}

        {/* Locked scorer display */}
        {isLocked && existing && (existing.homeScorerPicks?.length > 0 || existing.awayScorerPicks?.length > 0) && (
          <div className="rounded-xl border border-border bg-card/50 p-3 space-y-2">
            <p className="text-xs font-semibold text-gray-400">Your scorer picks</p>
            {existing.homeScorerPicks?.length > 0 && (
              <div>
                <span className="text-[10px] text-gray-500 mr-1">{match.homeTeam.name}:</span>
                {existing.homeScorerPicks.map(p => (
                  <span key={p} className="mr-1 text-[11px] font-semibold text-gray-200">{p}</span>
                ))}
              </div>
            )}
            {existing.awayScorerPicks?.length > 0 && (
              <div>
                <span className="text-[10px] text-gray-500 mr-1">{match.awayTeam.name}:</span>
                {existing.awayScorerPicks.map(p => (
                  <span key={p} className="mr-1 text-[11px] font-semibold text-gray-200">{p}</span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Team info */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-400">Team info</p>
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
          <p className="text-center text-xs text-gray-500">Predictions locked — match has started</p>
        )}
      </div>
    </Modal>
  );
}
