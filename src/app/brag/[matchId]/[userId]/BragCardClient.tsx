'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getPrediction } from '@/lib/predictionsService';
import { useAuthStore } from '@/store';
import type { Match } from '@/types/match';
import type { Prediction } from '@/types/prediction';

const HEX_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="78" height="90"><polygon points="39,2 76,22.5 76,67.5 39,88 2,67.5 2,22.5" fill="none" stroke="white" stroke-width="1" opacity="0.12"/></svg>';

type CardType = 'perfect' | 'outcome' | null;

function resolveCardType(ph: number, pa: number, h: number, a: number): CardType {
  if (ph === h && pa === a) return 'perfect';
  if (Math.sign(ph - pa) === Math.sign(h - a)) return 'outcome';
  return null;
}

function stageLabel(stage: string) {
  const map: Record<string, string> = {
    group: 'Group Stage',
    'round-of-32': 'Round of 32',
    'round-of-16': 'Round of 16',
    'quarter-final': 'Quarter-final',
    'semi-final': 'Semi-final',
    'third-place': 'Third Place',
    final: 'Final',
  };
  return map[stage] ?? stage;
}

function normalize(s: string) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

export function BragCardClient({
  matchId,
  userId,
  match,
}: {
  matchId: string;
  userId: string;
  match: Match;
}) {
  const searchParams = useSearchParams();
  const { user } = useAuthStore();

  const urlH  = searchParams.get('h');
  const urlA  = searchParams.get('a');
  const urlPh = searchParams.get('ph');
  const urlPa = searchParams.get('pa');

  const [pred, setPred] = useState<Prediction | null>(null);
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);

  // Apply hex pattern to the card background overlay
  useEffect(() => {
    const el = document.getElementById('brag-hex');
    if (el) {
      el.style.backgroundImage = `url("data:image/svg+xml,${encodeURIComponent(HEX_SVG)}")`;
    }
  }, []);

  useEffect(() => {
    getPrediction(userId, matchId).then(setPred).catch(() => setPred(null));
  }, [userId, matchId]);

  // Resolve scores: URL params first (instant), Firestore fills in if missing
  const actualH  = urlH  !== null ? Number(urlH)  : match.homeScore ?? null;
  const actualA  = urlA  !== null ? Number(urlA)  : match.awayScore ?? null;
  const predH    = urlPh !== null ? Number(urlPh) : pred?.homeScore ?? null;
  const predA    = urlPa !== null ? Number(urlPa) : pred?.awayScore ?? null;

  const cardType: CardType = (actualH !== null && actualA !== null && predH !== null && predA !== null)
    ? resolveCardType(predH, predA, actualH, actualA)
    : null;

  // Find scorer the user correctly predicted (for perfect card footer)
  const correctScorer = (() => {
    if (cardType !== 'perfect' || !pred) return null;
    const allActual = [...(match.homeScorers ?? []), ...(match.awayScorers ?? [])];
    const allPicks  = [...(pred.homeScorerPicks ?? []), ...(pred.awayScorerPicks ?? [])];
    return allPicks.find(p => allActual.some(s => normalize(s) === normalize(p))) ?? null;
  })();

  const accent     = cardType === 'perfect' ? '#FF4DA8' : '#1D9E75';
  const scoreColor = cardType === 'perfect' ? '#FF4DA8' : '#FFFFFF';
  const pts        = pred?.pointsEarned ?? null;

  // Statement text
  const predOutcome = predH !== null && predA !== null ? Math.sign(predH - predA) : 0;
  const stmt = (() => {
    if (cardType === 'perfect') return { s1: 'I PREDICTED THE', s2: 'EXACT FINAL', s3: 'SCORE' };
    if (predOutcome === 0)      return { s1: 'I PREDICTED', s2: 'IT ENDS IN', s3: 'A DRAW' };
    const winner = predOutcome > 0 ? match.homeTeam.name : match.awayTeam.name;
    return { s1: 'I PREDICTED', s2: `${winner.toUpperCase()} WOULD`, s3: 'WIN' };
  })();

  const homeFlag = match.homeTeam.flagUrl.replace('/w40/', '/w80/');
  const awayFlag = match.awayTeam.flagUrl.replace('/w40/', '/w80/');

  const kickoff   = new Date(match.kickoffAt);
  const matchDate = kickoff.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });

  const pageUrl   = `https://myworldcupschedule.com/brag/${matchId}/${userId}?h=${actualH}&a=${actualA}&ph=${predH}&pa=${predA}`;
  const ogImgUrl  = `https://myworldcupschedule.com/api/brag-og?m=${matchId}&h=${actualH}&a=${actualA}&ph=${predH}&pa=${predA}`;
  const shareTitle = cardType === 'perfect'
    ? `I predicted the exact score: ${match.homeTeam.name} ${actualH}–${actualA} ${match.awayTeam.name} 🎯`
    : `I called it: ${match.homeTeam.name} ${actualH}–${actualA} ${match.awayTeam.name} ✅`;
  const shareText = 'Think you can do better? Predict World Cup scores at MyWorldCupSchedule.com';

  const downloadImage = useCallback(async () => {
    try {
      const res = await fetch(ogImgUrl);
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `worldcup-brag-${matchId}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      window.open(ogImgUrl, '_blank');
    }
  }, [ogImgUrl, matchId]);

  const shareNative = useCallback(async () => {
    setSharing(true);
    try {
      // Try sharing the actual image file (enables Instagram Stories on mobile)
      const res  = await fetch(ogImgUrl);
      const blob = await res.blob();
      const file = new File([blob], 'worldcup-brag.png', { type: 'image/png' });

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: shareTitle, text: shareText });
      } else if (navigator.share) {
        await navigator.share({ title: shareTitle, text: shareText, url: pageUrl });
      } else {
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}`,
          '_blank', 'width=600,height=400,noopener,noreferrer',
        );
      }
    } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        // If image fetch fails, fall back to URL-only share
        try {
          await navigator.share?.({ title: shareTitle, text: shareText, url: pageUrl });
        } catch {}
      }
    } finally {
      setSharing(false);
    }
  }, [ogImgUrl, shareTitle, shareText, pageUrl]);

  const shareToInstagram = useCallback(async () => {
    try {
      const res  = await fetch(ogImgUrl);
      const blob = await res.blob();
      const file = new File([blob], 'worldcup-brag.png', { type: 'image/png' });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: shareTitle });
        return;
      }
    } catch {}
    // Fallback: download image
    await downloadImage();
  }, [ogImgUrl, shareTitle, downloadImage]);

  const copyLink = useCallback(async () => {
    await navigator.clipboard.writeText(pageUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [pageUrl]);

  // While we don't know scores yet, show a loading state
  if (cardType === null && (actualH === null || predH === null)) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: '#06091A' }}>
        <div className="animate-pulse" style={{ color: '#7A91BB' }}>Loading…</div>
      </div>
    );
  }

  // Wrong outcome — this URL should never be generated by the app, but handle it gracefully
  if (cardType === null) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6" style={{ background: '#06091A' }}>
        <p style={{ color: '#7A91BB', textAlign: 'center' }}>
          This prediction isn&apos;t shareable — the outcome wasn&apos;t correct.
        </p>
        <Link href="/schedule" style={{ color: '#FF4DA8', fontSize: 14 }}>← Back to schedule</Link>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col items-center justify-start px-4 py-6"
      style={{ background: '#06091A', minHeight: '100%' }}
    >

      {/* ── BRAG CARD ── */}
      <div
        style={{
          width: '100%', maxWidth: 400,
          borderRadius: 14, overflow: 'hidden',
          border: '1px solid #1C3045',
          background: '#090F17',
          position: 'relative',
          minHeight: 555,
          marginBottom: 20,
        }}
      >
        {/* Background layers */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0,
          backgroundImage: "url('/brag-bg.jpg')",
          backgroundSize: 'cover', backgroundPosition: 'center',
        }} />
        <div
          id="brag-hex"
          style={{ position: 'absolute', inset: 0, zIndex: 1, backgroundSize: '78px 90px' }}
        />
        <div style={{ position: 'absolute', inset: 0, zIndex: 2, background: 'rgba(5,10,18,0.55)' }} />

        {/* Top accent bar */}
        <div style={{ position: 'relative', zIndex: 4, height: 4, background: accent }} />

        {/* Card content */}
        <div style={{ position: 'relative', zIndex: 4, textAlign: 'center', padding: '1.5rem 1.375rem 9rem' }}>
          <div style={{
            fontSize: 11, color: '#7AAEC8', fontWeight: 700,
            letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '1.125rem',
          }}>
            2026 FIFA World Cup
          </div>

          {/* Statement */}
          <div style={{ lineHeight: 1.05, marginBottom: '1.75rem' }}>
            <div style={{
              fontFamily: 'var(--font-barlow-condensed)',
              fontSize: 13, letterSpacing: '0.16em', color: '#5A90B0',
              textTransform: 'uppercase',
            }}>
              {stmt.s1}
            </div>
            <div style={{
              fontFamily: 'var(--font-barlow-condensed)',
              fontSize: 44, letterSpacing: '0.03em', color: '#FFFFFF',
              textTransform: 'uppercase', lineHeight: 1,
            }}>
              {stmt.s2}
            </div>
            <div style={{
              fontFamily: 'var(--font-barlow-condensed)',
              fontSize: 44, letterSpacing: '0.03em', color: accent,
              textTransform: 'uppercase', lineHeight: 1,
            }}>
              {stmt.s3}
            </div>
          </div>

          {/* Team cards + score */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            {/* Home team */}
            <div style={{
              background: 'rgba(4,10,18,0.72)', borderRadius: 10,
              border: `1.5px solid ${accent}`, padding: '9px 14px',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={homeFlag}
                alt={match.homeTeam.code}
                width={34} height={23}
                style={{ objectFit: 'cover', borderRadius: 3 }}
              />
              <span style={{
                fontFamily: 'var(--font-barlow-condensed)',
                fontSize: 19, color: '#FFFFFF',
                letterSpacing: '0.08em', textTransform: 'uppercase',
              }}>
                {match.homeTeam.name}
              </span>
            </div>

            {/* Score */}
            <div style={{
              fontFamily: 'var(--font-barlow-condensed)',
              fontSize: 52, lineHeight: 1,
              letterSpacing: '0.02em', minWidth: 65,
              textAlign: 'center', color: scoreColor,
            }}>
              {actualH}–{actualA}
            </div>

            {/* Away team */}
            <div style={{
              background: 'rgba(4,10,18,0.72)', borderRadius: 10,
              border: `1.5px solid ${accent}`, padding: '9px 14px',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={awayFlag}
                alt={match.awayTeam.code}
                width={34} height={23}
                style={{ objectFit: 'cover', borderRadius: 3 }}
              />
              <span style={{
                fontFamily: 'var(--font-barlow-condensed)',
                fontSize: 19, color: '#FFFFFF',
                letterSpacing: '0.08em', textTransform: 'uppercase',
              }}>
                {match.awayTeam.name}
              </span>
            </div>
          </div>
        </div>

        {/* ── Card footer (pinned to bottom) ── */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 4,
          background: 'rgba(4,9,15,0.92)',
        }}>
          {/* Accent rule */}
          <div style={{ height: 2, background: accent }} />

          {/* Match info */}
          <div style={{
            padding: '0.75rem 1.375rem 0.6rem', textAlign: 'center',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}>
            <div style={{ fontSize: 12, color: '#6590AE', fontWeight: 500 }}>
              {stageLabel(match.stage)} · {matchDate} · {match.city}
            </div>
          </div>

          {/* Scorer row (only on perfect score card, only if they got a scorer right) */}
          {correctScorer && (
            <div style={{
              padding: '0.6rem 1.375rem', textAlign: 'center',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}>
              <span style={{ fontSize: 13, color: '#9CBDD0' }}>Predicted </span>
              <span style={{
                fontFamily: 'var(--font-barlow-condensed)',
                fontSize: 17, color: '#FFFFFF', letterSpacing: '0.06em',
              }}>
                {correctScorer}
              </span>
              <span style={{ fontSize: 13, color: '#9CBDD0' }}> to score </span>
              <span style={{ color: '#FF4DA8', fontWeight: 700, fontSize: 15 }}>✓</span>
            </div>
          )}

          {/* Stats row */}
          <div style={{
            padding: '0.875rem 1.375rem 0.625rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {pts !== null && (
              <>
                <div style={{ flex: 1, textAlign: 'center', padding: '0 4px' }}>
                  <div style={{
                    fontFamily: 'var(--font-barlow-condensed)',
                    fontSize: 26, lineHeight: 1, color: accent,
                  }}>
                    +{pts} pts
                  </div>
                  <div style={{
                    fontSize: 10, color: '#3D6580',
                    letterSpacing: '0.14em', textTransform: 'uppercase',
                    marginTop: 3, fontWeight: 700,
                  }}>
                    Points
                  </div>
                </div>
                <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.07)' }} />
              </>
            )}
            {user?.totalPoints !== undefined && (
              <>
                <div style={{ flex: 1, textAlign: 'center', padding: '0 4px' }}>
                  <div style={{
                    fontFamily: 'var(--font-barlow-condensed)',
                    fontSize: 26, color: '#FFFFFF', lineHeight: 1,
                  }}>
                    {user.totalPoints}
                  </div>
                  <div style={{
                    fontSize: 10, color: '#3D6580',
                    letterSpacing: '0.14em', textTransform: 'uppercase',
                    marginTop: 3, fontWeight: 700,
                  }}>
                    Total pts
                  </div>
                </div>
                {user?.globalRank && (
                  <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.07)' }} />
                )}
              </>
            )}
            {user?.globalRank && (
              <div style={{ flex: 1, textAlign: 'center', padding: '0 4px' }}>
                <div style={{
                  fontFamily: 'var(--font-barlow-condensed)',
                  fontSize: 26, color: '#FFFFFF', lineHeight: 1,
                }}>
                  #{user.globalRank}
                </div>
                <div style={{
                  fontSize: 10, color: '#3D6580',
                  letterSpacing: '0.14em', textTransform: 'uppercase',
                  marginTop: 3, fontWeight: 700,
                }}>
                  Global rank
                </div>
              </div>
            )}
          </div>

          {/* Site URL */}
          <div style={{ padding: '0 1.375rem 1rem', textAlign: 'center' }}>
            <div style={{
              fontSize: 11, color: '#FFFFFF',
              letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600,
            }}>
              only at MyWorldCupSchedule.com
            </div>
          </div>
        </div>
      </div>

      {/* ── SHARE PANEL ── */}
      <div
        style={{
          width: '100%', maxWidth: 400,
          background: '#0D1830',
          borderRadius: 14,
          border: '1px solid rgba(255,255,255,0.07)',
          padding: '1.125rem',
          marginBottom: 20,
        }}
      >
        <p style={{ fontSize: 13, fontWeight: 600, color: '#E8F0FF', margin: '0 0 0.875rem' }}>
          Share your result
        </p>

        {/* Primary share button */}
        <button
          onClick={shareNative}
          disabled={sharing}
          style={{
            width: '100%', background: '#FF4DA8', border: 'none',
            borderRadius: 12, padding: '15px 0', fontSize: 15, fontWeight: 700,
            color: '#06091A', cursor: sharing ? 'default' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            marginBottom: '1rem', opacity: sharing ? 0.7 : 1,
            transition: 'opacity 0.15s',
          }}
        >
          {sharing ? 'Opening…' : '🏆 Brag on socials'}
        </button>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1rem' }}>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', whiteSpace: 'nowrap' }}>
            or share directly to
          </span>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
        </div>

        {/* 2×2 grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {/* Facebook */}
          <button
            onClick={() => window.open(
              `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}`,
              '_blank', 'width=600,height=400,noopener,noreferrer',
            )}
            style={{
              background: '#1877F2', borderRadius: 12, padding: '13px 12px',
              border: 'none', cursor: 'pointer', textAlign: 'left',
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>Facebook</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>Share a post</div>
          </button>

          {/* Instagram */}
          <button
            onClick={shareToInstagram}
            style={{
              background: '#833AB4', borderRadius: 12, padding: '13px 12px',
              border: 'none', cursor: 'pointer', textAlign: 'left',
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>Instagram</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>Save &amp; share to story</div>
          </button>

          {/* Save image */}
          <button
            onClick={downloadImage}
            style={{
              background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: '13px 12px',
              border: '0.5px solid rgba(255,255,255,0.1)', cursor: 'pointer', textAlign: 'left',
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 600, color: '#E8F0FF' }}>Save image</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>Post to TikTok or anywhere</div>
          </button>

          {/* Copy link */}
          <button
            onClick={copyLink}
            style={{
              background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: '13px 12px',
              border: '0.5px solid rgba(255,255,255,0.1)', cursor: 'pointer', textAlign: 'left',
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 600, color: copied ? accent : '#E8F0FF' }}>
              {copied ? '✓ Copied!' : 'Copy link'}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>Paste anywhere</div>
          </button>
        </div>
      </div>

      {/* Back link */}
      <Link
        href="/schedule"
        style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', textDecoration: 'none' }}
      >
        ← Back to predictions
      </Link>
    </div>
  );
}
