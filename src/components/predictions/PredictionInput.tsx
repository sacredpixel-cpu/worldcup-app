'use client';

import { useState } from 'react';
import { usePredictionsStore } from '@/store';
import type { Match } from '@/types/match';
import type { Prediction } from '@/types/prediction';

function ScoreStepper({ value, onChange, locked }: { value: number; onChange: (v: number) => void; locked: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <button
        disabled={locked || value <= 0}
        onClick={() => onChange(value - 1)}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-lg font-bold text-white disabled:opacity-30 active:scale-90"
      >−</button>
      <span className="w-6 text-center text-xl font-bold text-white">{value}</span>
      <button
        disabled={locked || value >= 9}
        onClick={() => onChange(value + 1)}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-lg font-bold text-white disabled:opacity-30 active:scale-90"
      >+</button>
    </div>
  );
}

function ShareButton({ match, prediction }: { match: Match; prediction: Prediction }) {
  const [copied, setCopied] = useState(false);
  const shareUrl = `https://worldcup-app-sooty.vercel.app/share/${match.id}/${prediction.userId}`;
  const text = `I'm predicting ${match.homeTeam.name} ${prediction.homeScore}–${prediction.awayScore} ${match.awayTeam.name} at the 2026 FIFA World Cup!`;
  const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'My World Cup Prediction', text, url: shareUrl });
        return;
      } catch {}
    }
    // Fallback: copy link
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="mt-2 flex gap-2">
      <button
        onClick={handleShare}
        className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border bg-card/50 py-2 text-xs font-semibold text-white/70 hover:bg-card active:scale-95"
      >
        {copied ? '✓ Link copied!' : '↑ Share prediction'}
      </button>
      <a
        href={fbUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center rounded-lg bg-[#1877F2] px-3 py-2 text-xs font-bold text-white active:scale-95"
      >
        f
      </a>
    </div>
  );
}

export function PredictionInput({ match, userId, existing }: {
  match: Match; userId: string; existing?: Prediction;
}) {
  const { draft, setDraft, submitPrediction } = usePredictionsStore();
  const isLocked = new Date(match.kickoffAt) <= new Date() || match.status !== 'upcoming';
  const d = draft[match.id];
  const homeScore = d?.homeScore ?? existing?.homeScore ?? 0;
  const awayScore = d?.awayScore ?? existing?.awayScore ?? 0;
  const isDirty = d !== undefined;
  const isSubmitted = !!existing && !d;

  if (isSubmitted && !isLocked) {
    return (
      <div className="mt-2">
        <div className="flex items-center justify-between rounded-lg border border-brand/30 bg-brand/10 px-3 py-2">
          <span className="text-xs text-brand-light">Your pick: {existing.homeScore}–{existing.awayScore}</span>
          <button onClick={() => setDraft(match.id, existing.homeScore, existing.awayScore)} className="text-xs text-white/50 hover:text-white">Edit</button>
        </div>
        <ShareButton match={match} prediction={existing} />
      </div>
    );
  }

  if (isLocked && existing) {
    return (
      <div className="mt-2">
        <div className="flex items-center gap-2 rounded-lg border border-border bg-card/50 px-3 py-2">
          <span className="text-xs text-white/50">Your pick:</span>
          <span className="text-sm font-bold text-white">{existing.homeScore}–{existing.awayScore}</span>
          <span className="ml-auto rounded-full bg-white/10 px-2 py-0.5 text-xs text-white/40">Locked</span>
        </div>
        <ShareButton match={match} prediction={existing} />
      </div>
    );
  }

  if (isLocked) return null;

  return (
    <div className="mt-2 rounded-lg border border-border bg-card/50 px-3 py-2">
      <p className="mb-2 text-xs text-white/50">Your prediction</p>
      <div className="flex items-center justify-between">
        <ScoreStepper value={homeScore} onChange={(v) => setDraft(match.id, v, awayScore)} locked={isLocked} />
        <span className="mx-2 text-lg font-bold text-white/30">–</span>
        <ScoreStepper value={awayScore} onChange={(v) => setDraft(match.id, homeScore, v)} locked={isLocked} />
      </div>
      {isDirty && (
        <button onClick={() => submitPrediction(match.id, userId)} className="mt-2 w-full rounded-lg bg-brand py-1.5 text-sm font-semibold text-white active:scale-95">
          Submit Prediction
        </button>
      )}
    </div>
  );
}
