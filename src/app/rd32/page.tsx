'use client';

export default function Rd32PreviewPage() {
  return (
    <>
      {/* Backdrop */}
      <div style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(5, 10, 18, 0.85)',
        backdropFilter: 'blur(4px)',
        zIndex: 50,
      }} />

      {/* Modal — fixed overlay, centered, 80% of screen height */}
      <div style={{
        position: 'fixed',
        inset: 0,
        zIndex: 51,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        fontFamily: 'var(--font-golos-text), sans-serif',
      }}>
        <div style={{
          width: '100%',
          maxWidth: 440,
          height: '82dvh',
          maxHeight: 700,
          background: 'linear-gradient(160deg, #1B263B 0%, #0D1B2A 60%, #111827 100%)',
          borderRadius: 20,
          border: '1px solid rgba(65, 90, 119, 0.5)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          position: 'relative',
          boxShadow: '0 32px 80px rgba(0,0,0,0.7)',
        }}>

          {/* Top accent bar */}
          <div style={{
            height: 4,
            background: 'linear-gradient(90deg, #415A77, #778DA9, #415A77)',
            flexShrink: 0,
          }} />

          {/* Glow behind content */}
          <div style={{
            position: 'absolute',
            top: -40,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 300,
            height: 300,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(65,90,119,0.15) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />

          {/* Scrollable content */}
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            padding: '24px 24px 24px',
            overflowY: 'auto',
            position: 'relative',
            zIndex: 1,
          }}>

            {/* Eyebrow */}
            <p style={{
              textAlign: 'center',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: '#778DA9',
              margin: '0 0 10px',
            }}>
              Announcement
            </p>

            {/* Headline */}
            <h1 style={{
              fontFamily: 'var(--font-barlow-condensed), sans-serif',
              fontSize: 'clamp(34px, 10vw, 46px)',
              fontWeight: 900,
              lineHeight: 1.0,
              textAlign: 'center',
              color: '#E0E1DD',
              margin: '0 0 12px',
              textTransform: 'uppercase',
              letterSpacing: '-0.01em',
            }}>
              We&rsquo;re Raising<br />the Stakes
            </h1>

            {/* Subhead */}
            <p style={{
              fontFamily: 'var(--font-barlow-condensed), sans-serif',
              fontSize: 'clamp(16px, 4vw, 19px)',
              fontWeight: 600,
              textAlign: 'center',
              color: '#778DA9',
              margin: '0 0 18px',
              lineHeight: 1.35,
            }}>
              Round of 32 Giveaways, points reset,<br />it&rsquo;s anyone&rsquo;s game.
            </p>

            {/* Divider */}
            <div style={{
              height: 1,
              background: 'linear-gradient(90deg, transparent, rgba(65,90,119,0.6), transparent)',
              margin: '0 0 18px',
              flexShrink: 0,
            }} />

            {/* Logos row */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 20,
              margin: '0 0 14px',
              flexShrink: 0,
            }}>
              {/* Mexillicious logo */}
              <img
                src="/mexillicious-logo.png"
                alt="Mexillicious"
                style={{ width: 72, height: 72, objectFit: 'contain' }}
              />

              {/* X separator */}
              <span style={{ fontSize: 18, color: '#415A77', fontWeight: 700 }}>×</span>

              {/* Incha logo — white filter so it shows on dark bg */}
              <img
                src="/inchalogo.png"
                alt="InchaStudios"
                style={{ width: 72, height: 60, objectFit: 'contain', filter: 'invert(1) brightness(0.75)' }}
              />
            </div>

            {/* Partner label */}
            <p style={{
              textAlign: 'center',
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: '#778DA9',
              margin: '0 0 16px',
              flexShrink: 0,
            }}>
              In partnership with InchaStudios
            </p>

            {/* Body copy */}
            <p style={{
              fontSize: 14,
              lineHeight: 1.7,
              color: '#9AAFC8',
              margin: '0 0 20px',
              textAlign: 'center',
            }}>
              We&rsquo;re teaming up with the Incha soccer brand for a giveaway of some of their gear for the top two finishers of the round of 32. The leaderboard will reset for this round. It&rsquo;s time to get geared up!
            </p>

            {/* CTA button */}
            <button style={{
              width: '100%',
              padding: '15px 24px',
              borderRadius: 12,
              background: 'linear-gradient(135deg, #415A77 0%, #1B263B 100%)',
              border: '1px solid rgba(119, 141, 169, 0.4)',
              color: '#E0E1DD',
              fontSize: 16,
              fontWeight: 700,
              fontFamily: 'var(--font-golos-text), sans-serif',
              letterSpacing: '0.02em',
              cursor: 'pointer',
              flexShrink: 0,
            }}>
              Let&rsquo;s Go →
            </button>

            {/* Dismiss */}
            <button style={{
              background: 'none',
              border: 'none',
              color: '#415A77',
              fontSize: 12,
              cursor: 'pointer',
              marginTop: 12,
              fontFamily: 'var(--font-golos-text), sans-serif',
              letterSpacing: '0.04em',
              flexShrink: 0,
            }}>
              Dismiss
            </button>

          </div>
        </div>
      </div>
    </>
  );
}
