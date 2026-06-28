'use client';

import { useState, useEffect } from 'react';

// Tracks how many distinct sessions have seen this modal (max 2).
// sessionStorage clears when the app is closed/tab is killed — so each
// fresh open of the app counts as a new session regardless of reload.
const LS_SESSIONS = 'rd32_modal_v2_sessions'; // v2 so everyone sees it fresh
const SS_FLAG     = 'rd32_modal_seen';

export function Rd32Modal() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Already shown within this session (navigation / hot reload)?
    if (sessionStorage.getItem(SS_FLAG)) return;

    // Already shown in 2 prior sessions?
    const sessionsShown = parseInt(localStorage.getItem(LS_SESSIONS) ?? '0', 10);
    if (sessionsShown >= 2) return;

    setVisible(true);
    sessionStorage.setItem(SS_FLAG, '1');
    localStorage.setItem(LS_SESSIONS, String(sessionsShown + 1));
  }, []);

  if (!visible) return null;

  return (
    <>
      {/* Backdrop */}
      <div style={{
        position: 'fixed', inset: 0,
        background: 'rgba(5,10,18,0.88)',
        backdropFilter: 'blur(4px)',
        zIndex: 200,
      }} />

      {/* Modal */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 201,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
        fontFamily: 'var(--font-golos-text), sans-serif',
      }}>
        <div style={{
          width: '100%', maxWidth: 440,
          height: '82dvh', maxHeight: 700,
          background: 'linear-gradient(160deg, #1B263B 0%, #0D1B2A 60%, #111827 100%)',
          borderRadius: 20,
          border: '1px solid rgba(65,90,119,0.5)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden', position: 'relative',
          boxShadow: '0 32px 80px rgba(0,0,0,0.7)',
        }}>
          {/* Top accent bar */}
          <div style={{ height: 4, background: 'linear-gradient(90deg, #415A77, #778DA9, #415A77)', flexShrink: 0 }} />

          {/* Glow */}
          <div style={{
            position: 'absolute', top: -40, left: '50%', transform: 'translateX(-50%)',
            width: 300, height: 300, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(65,90,119,0.15) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />

          {/* Scrollable content */}
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            padding: '24px 24px 24px',
            overflowY: 'auto', position: 'relative', zIndex: 1,
          }}>
            <p style={{
              textAlign: 'center', fontSize: 11, fontWeight: 700,
              letterSpacing: '0.18em', textTransform: 'uppercase',
              color: '#778DA9', margin: '0 0 10px',
            }}>Announcement</p>

            <h1 style={{
              fontFamily: 'var(--font-barlow-condensed), sans-serif',
              fontSize: 'clamp(34px, 10vw, 46px)', fontWeight: 900,
              lineHeight: 1.0, textAlign: 'center', color: '#E0E1DD',
              margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '-0.01em',
            }}>
              We&rsquo;re Raising<br />the Stakes
            </h1>

            <p style={{
              fontFamily: 'var(--font-barlow-condensed), sans-serif',
              fontSize: 'clamp(16px, 4vw, 19px)', fontWeight: 600,
              textAlign: 'center', color: '#778DA9',
              margin: '0 0 18px', lineHeight: 1.35,
            }}>
              Round of 32 Giveaways, points reset,<br />it&rsquo;s anyone&rsquo;s game.
            </p>

            <div style={{
              height: 1,
              background: 'linear-gradient(90deg, transparent, rgba(65,90,119,0.6), transparent)',
              margin: '0 0 18px', flexShrink: 0,
            }} />

            {/* Logos */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 20, margin: '0 0 14px', flexShrink: 0,
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/mexillicious-logo.png" alt="Mexillicious" style={{ width: 72, height: 72, objectFit: 'contain' }} />
              <span style={{ fontSize: 18, color: '#415A77', fontWeight: 700 }}>×</span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/inchalogo.png" alt="InchaStudios" style={{ width: 72, height: 60, objectFit: 'contain', filter: 'invert(1) brightness(0.75)' }} />
            </div>

            <p style={{
              textAlign: 'center', fontSize: 10, fontWeight: 700,
              letterSpacing: '0.14em', textTransform: 'uppercase',
              color: '#778DA9', margin: '0 0 16px', flexShrink: 0,
            }}>In partnership with InchaStudios</p>

            <p style={{
              fontSize: 14, lineHeight: 1.7, color: '#9AAFC8',
              margin: '0 0 20px', textAlign: 'center',
            }}>
              We&rsquo;re teaming up with INCHA Studios, a brand dedicated to celebrating the culture and passion of the beautiful game. The top two finishers in the Round of 32 will take home exclusive INCHA gear. The leaderboard will reset for this round. It&rsquo;s time to gear up!
            </p>

            <button
              onClick={() => setVisible(false)}
              style={{
                width: '100%', padding: '15px 24px', borderRadius: 12,
                background: 'linear-gradient(135deg, #415A77 0%, #1B263B 100%)',
                border: '1px solid rgba(119,141,169,0.4)',
                color: '#E0E1DD', fontSize: 16, fontWeight: 700,
                fontFamily: 'var(--font-golos-text), sans-serif',
                letterSpacing: '0.02em', cursor: 'pointer', flexShrink: 0,
              }}
            >
              Let&rsquo;s Go →
            </button>

            <button
              onClick={() => setVisible(false)}
              style={{
                background: 'none', border: 'none', color: '#415A77',
                fontSize: 12, cursor: 'pointer', marginTop: 12,
                fontFamily: 'var(--font-golos-text), sans-serif',
                letterSpacing: '0.04em', flexShrink: 0,
              }}
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
