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

  async function handleInstagram() {
    await navigator.clipboard.writeText(shareUrl);
    window.open('https://www.instagram.com/', '_blank');
  }

  async function handleTikTok() {
    await navigator.clipboard.writeText(shareUrl);
    window.open('https://www.tiktok.com/', '_blank');
  }

  return (
    <div className="mt-2 flex gap-2">
      <button
        onClick={handleShare}
        className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border bg-card/50 py-2 text-xs font-semibold text-white/70 hover:bg-card active:scale-95"
      >
        {copied ? '✓ Copied!' : '↑ Share'}
      </button>

      {/* Facebook */}
      <a href={fbUrl} target="_blank" rel="noopener noreferrer"
        className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1877F2] active:scale-95">
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-white">
          <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.791-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
        </svg>
      </a>

      {/* Instagram */}
      <button onClick={handleInstagram}
        className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#F58529] via-[#DD2A7B] to-[#515BD4] active:scale-95">
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-white">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
        </svg>
      </button>

      {/* TikTok */}
      <button onClick={handleTikTok}
        className="flex h-9 w-9 items-center justify-center rounded-lg bg-black border border-white/10 active:scale-95">
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-white">
          <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.79 1.53V6.77a4.85 4.85 0 01-1.02-.08z"/>
        </svg>
      </button>
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
