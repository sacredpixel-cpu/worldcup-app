'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useAuthStore } from '@/store';
import { usePredictionsStore } from '@/store/slices/predictionsSlice';
import { useMatchesStore } from '@/store/slices/matchesSlice';
import { ALL_MATCHES } from '@/data/matches';
import { calcPoints } from '@/lib/utils/calcPoints';
import { getGradingScore } from '@/lib/utils/getGradingScore';
import { teamDisplayCode } from '@/lib/utils/teamDisplayCode';
import type { Match } from '@/types/match';
import type { Prediction } from '@/types/prediction';

const HEX_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="78" height="90"><polygon points="39,2 76,22.5 76,67.5 39,88 2,67.5 2,22.5" fill="none" stroke="white" stroke-width="1" opacity="0.12"/></svg>';

const STAGE_LABELS: Record<string, string> = {
  group: 'Group Stage',
  'round-of-32': 'Round of 32',
  'round-of-16': 'Round of 16',
  'quarter-final': 'Quarter-final',
  'semi-final': 'Semi-final',
  'third-place': 'Third Place',
  final: 'Final',
};

interface PendingBrag {
  match: Match;
  pred: Prediction;
  cardType: 'perfect' | 'outcome';
  actualH: number;
  actualA: number;
  pts: number;
}

function seenKey(matchId: string, userId: string) {
  return `brag_shown_${matchId}_${userId}`;
}

export function BragCardAutoPopup() {
  const { user } = useAuthStore();
  const { saved, syncedToFirestore } = usePredictionsStore();
  const { getLiveMatch, updates } = useMatchesStore();

  const [current, setCurrent] = useState<PendingBrag | null>(null);
  const [copied, setCopied] = useState(false);

  // Find the first unshown correct prediction for a finished match
  useEffect(() => {
    if (!user || !syncedToFirestore || current !== null) return;

    for (const m of ALL_MATCHES) {
      const liveMatch = getLiveMatch(m);
      if (liveMatch.status !== 'finished') continue;

      const gradingScore = getGradingScore(liveMatch);
      if (!gradingScore) continue;

      const pred = saved[m.id];
      if (!pred || pred.homeScore === null || pred.awayScore === null) continue;

      const { homeScore: h, awayScore: a } = gradingScore;
      const ph = pred.homeScore, pa = pred.awayScore;

      const isCorrect = Math.sign(ph - pa) === Math.sign(h - a);
      if (!isCorrect) continue;

      if (localStorage.getItem(seenKey(m.id, user.id))) continue;

      const cardType = ph === h && pa === a ? 'perfect' : 'outcome';
      const pts = calcPoints(pred, {
        homeScore: h, awayScore: a,
        homeScorers: liveMatch.homeScorers,
        awayScorers: liveMatch.awayScorers,
      });

      setCurrent({ match: liveMatch, pred, cardType, actualH: h, actualA: a, pts });
      break;
    }
  }, [user, syncedToFirestore, saved, updates, getLiveMatch, current]);

  const dismiss = useCallback(() => {
    if (current && user) {
      localStorage.setItem(seenKey(current.match.id, user.id), '1');
    }
    setCurrent(null);
    setCopied(false);
  }, [current, user]);

  // Compute live total across all finished matches (same as AuthBanner)
  const totalPts = useMemo(() => {
    if (!user) return null;
    return ALL_MATCHES
      .map(getLiveMatch)
      .filter(m => m.status === 'finished' && m.homeScore !== null)
      .reduce((sum, m) => {
        const p = saved[m.id];
        if (!p) return sum;
        return sum + calcPoints(p, {
          homeScore: m.homeScore!, awayScore: m.awayScore!,
          homeScorers: m.homeScorers, awayScorers: m.awayScorers,
        });
      }, 0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, saved, updates]);

  const downloadImage = useCallback(async () => {
    if (!current || !user) return;
    const { match, actualH, actualA, pred } = current;
    const ogUrl = `/api/brag-og?m=${match.id}&h=${actualH}&a=${actualA}&ph=${pred.homeScore}&pa=${pred.awayScore}`;
    try {
      const res = await fetch(ogUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `worldcup-brag-${match.id}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      window.open(ogUrl, '_blank');
    }
  }, [current, user]);

  const copyLink = useCallback(async () => {
    if (!current || !user) return;
    const { match, actualH, actualA, pred } = current;
    const pageUrl = `https://myworldcupschedule.com/brag/${match.id}/${user.id}?h=${actualH}&a=${actualA}&ph=${pred.homeScore}&pa=${pred.awayScore}`;
    await navigator.clipboard.writeText(pageUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [current, user]);

  if (!current || !user) return null;

  const { match, pred, cardType, actualH, actualA, pts } = current;
  const accent = cardType === 'perfect' ? '#FF4DA8' : '#1D9E75';
  const scoreColor = cardType === 'perfect' ? '#FF4DA8' : '#FFFFFF';
  const ph = pred.homeScore!, pa = pred.awayScore!;
  const predOutcome = Math.sign(ph - pa);
  const pageUrl = `https://myworldcupschedule.com/brag/${match.id}/${user.id}?h=${actualH}&a=${actualA}&ph=${ph}&pa=${pa}`;
  const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}`;

  const stmt = (() => {
    if (cardType === 'perfect') return { s1: 'I PREDICTED THE', s2: 'EXACT FINAL', s3: 'SCORE' };
    if (predOutcome === 0)      return { s1: 'I PREDICTED', s2: 'IT ENDS IN', s3: 'A DRAW' };
    const winner = predOutcome > 0 ? match.homeTeam.name : match.awayTeam.name;
    return { s1: 'I PREDICTED', s2: `${winner.toUpperCase()} WOULD`, s3: 'WIN' };
  })();

  const kickoff  = new Date(match.kickoffAt);
  const matchDate = kickoff.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
  const homeFlag  = match.homeTeam.flagUrl.replace('/w40/', '/w80/');
  const awayFlag  = match.awayTeam.flagUrl.replace('/w40/', '/w80/');
  const hexBg     = `url("data:image/svg+xml,${encodeURIComponent(HEX_SVG)}")`;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.88)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', overflowY: 'auto',
        padding: '12px 16px 32px',
      }}
    >
      {/* Close row */}
      <div style={{ width: '100%', maxWidth: 400, display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
        <button
          onClick={dismiss}
          aria-label="Close"
          style={{
            background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff',
            borderRadius: '50%', width: 36, height: 36,
            fontSize: 16, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          ✕
        </button>
      </div>

      {/* ── Brag card ── */}
      <div style={{
        width: '100%', maxWidth: 400,
        borderRadius: 14, overflow: 'hidden',
        border: '1px solid #1C3045',
        background: '#090F17',
        position: 'relative', minHeight: 520,
        marginBottom: 16,
      }}>
        {/* Background layers */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 0, backgroundImage: "url('/brag-bg.jpg')", backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div style={{ position: 'absolute', inset: 0, zIndex: 1, backgroundImage: hexBg, backgroundSize: '78px 90px' }} />
        <div style={{ position: 'absolute', inset: 0, zIndex: 2, background: 'rgba(5,10,18,0.55)' }} />

        {/* Top accent bar */}
        <div style={{ position: 'relative', zIndex: 4, height: 4, background: accent }} />

        {/* Card content */}
        <div style={{ position: 'relative', zIndex: 4, textAlign: 'center', padding: '1.25rem 1.375rem 8.5rem' }}>
          <div style={{ fontSize: 11, color: '#7AAEC8', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '1rem' }}>
            2026 FIFA World Cup
          </div>

          {/* Statement */}
          <div style={{ lineHeight: 1.05, marginBottom: '1.5rem' }}>
            <div style={{ fontFamily: 'var(--font-barlow-condensed)', fontSize: 13, letterSpacing: '0.16em', color: '#5A90B0', textTransform: 'uppercase' }}>
              {stmt.s1}
            </div>
            <div style={{ fontFamily: 'var(--font-barlow-condensed)', fontSize: 44, letterSpacing: '0.03em', color: '#FFFFFF', textTransform: 'uppercase', lineHeight: 1 }}>
              {stmt.s2}
            </div>
            <div style={{ fontFamily: 'var(--font-barlow-condensed)', fontSize: 44, letterSpacing: '0.03em', color: accent, textTransform: 'uppercase', lineHeight: 1 }}>
              {stmt.s3}
            </div>
          </div>

          {/* Team cards + score */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            <div style={{ background: 'rgba(4,10,18,0.72)', borderRadius: 10, border: `1.5px solid ${accent}`, padding: '9px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={homeFlag} alt={match.homeTeam.code} width={34} height={23} style={{ objectFit: 'cover', borderRadius: 3 }} />
              <span style={{ fontFamily: 'var(--font-barlow-condensed)', fontSize: 19, color: '#FFFFFF', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                {teamDisplayCode(match.homeTeam.name)}
              </span>
            </div>
            <div style={{ fontFamily: 'var(--font-barlow-condensed)', fontSize: 52, lineHeight: 1, letterSpacing: '0.02em', minWidth: 65, textAlign: 'center', color: scoreColor }}>
              {actualH}–{actualA}
            </div>
            <div style={{ background: 'rgba(4,10,18,0.72)', borderRadius: 10, border: `1.5px solid ${accent}`, padding: '9px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={awayFlag} alt={match.awayTeam.code} width={34} height={23} style={{ objectFit: 'cover', borderRadius: 3 }} />
              <span style={{ fontFamily: 'var(--font-barlow-condensed)', fontSize: 19, color: '#FFFFFF', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                {teamDisplayCode(match.awayTeam.name)}
              </span>
            </div>
          </div>
        </div>

        {/* ── Card footer ── */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 4, background: 'rgba(4,9,15,0.92)' }}>
          <div style={{ height: 2, background: accent }} />
          <div style={{ padding: '0.625rem 1.375rem 0.5rem', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: 12, color: '#6590AE', fontWeight: 500 }}>
              {STAGE_LABELS[match.stage] ?? match.stage} · {matchDate} · {match.city}
            </div>
          </div>
          {/* Stats */}
          <div style={{ padding: '0.75rem 1.375rem 0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ flex: 1, textAlign: 'center', padding: '0 4px' }}>
              <div style={{ fontFamily: 'var(--font-barlow-condensed)', fontSize: 26, lineHeight: 1, color: accent }}>
                +{pts} pts
              </div>
              <div style={{ fontSize: 10, color: '#3D6580', letterSpacing: '0.14em', textTransform: 'uppercase', marginTop: 3, fontWeight: 700 }}>
                Points
              </div>
            </div>
            {totalPts !== null && (
              <>
                <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.07)' }} />
                <div style={{ flex: 1, textAlign: 'center', padding: '0 4px' }}>
                  <div style={{ fontFamily: 'var(--font-barlow-condensed)', fontSize: 26, color: '#FFFFFF', lineHeight: 1 }}>
                    {totalPts}
                  </div>
                  <div style={{ fontSize: 10, color: '#3D6580', letterSpacing: '0.14em', textTransform: 'uppercase', marginTop: 3, fontWeight: 700 }}>
                    Total pts
                  </div>
                </div>
              </>
            )}
          </div>
          <div style={{ padding: '0 1.375rem 0.875rem', textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: '#FFFFFF', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600 }}>
              only at MyWorldCupSchedule.com
            </div>
          </div>
        </div>
      </div>

      {/* ── Share panel ── */}
      <div style={{ width: '100%', maxWidth: 400, background: '#0D1830', borderRadius: 14, border: '1px solid rgba(255,255,255,0.07)', padding: '1.125rem', marginBottom: 12 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: '#E8F0FF', margin: '0 0 0.875rem' }}>
          Share your result
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <button
            onClick={() => window.open(fbUrl, '_blank', 'width=600,height=400,noopener,noreferrer')}
            style={{ background: '#1877F2', borderRadius: 12, padding: '13px 12px', border: 'none', cursor: 'pointer', textAlign: 'left' }}
          >
            <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>Facebook</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>Share a post</div>
          </button>
          <button
            onClick={downloadImage}
            style={{ background: '#833AB4', borderRadius: 12, padding: '13px 12px', border: 'none', cursor: 'pointer', textAlign: 'left' }}
          >
            <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>Instagram</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>Save &amp; share to story</div>
          </button>
          <button
            onClick={downloadImage}
            style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: '13px 12px', border: '0.5px solid rgba(255,255,255,0.1)', cursor: 'pointer', textAlign: 'left' }}
          >
            <div style={{ fontSize: 13, fontWeight: 600, color: '#E8F0FF' }}>Save image</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>Post to TikTok or anywhere</div>
          </button>
          <button
            onClick={copyLink}
            style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: '13px 12px', border: '0.5px solid rgba(255,255,255,0.1)', cursor: 'pointer', textAlign: 'left' }}
          >
            <div style={{ fontSize: 13, fontWeight: 600, color: copied ? accent : '#E8F0FF' }}>
              {copied ? '✓ Copied!' : 'Copy link'}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>Paste anywhere</div>
          </button>
        </div>
      </div>

      <button
        onClick={dismiss}
        style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0' }}
      >
        Close
      </button>
    </div>
  );
}
