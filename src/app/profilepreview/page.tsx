'use client';

// ─── Dummy data ───────────────────────────────────────────────────────────────

const DUMMY_USER = {
  displayName: 'GoalKing88',
  email: 'goalking@example.com',
  avatarUrl: 'https://i.pravatar.cc/150?u=2',
  country: 'Mexico',
  countryCode: 'mx',
  state: undefined as string | undefined,
};

const DUMMY_STATS = {
  pts: 142,
  totalPredictions: 38,
  exact: 9,
  accuracy: 61,
};

const DUMMY_GROUPS = [
  { id: 'g1', name: 'LA Fútbol Crew', members: 5 },
  { id: 'g2', name: 'World Cup Nerds', members: 3 },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProfilePreviewPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', paddingBottom: 16, fontFamily: 'var(--font-golos-text), sans-serif' }}>

      {/* Avatar + name */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 16px 16px' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={DUMMY_USER.avatarUrl}
          alt={DUMMY_USER.displayName}
          style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', marginBottom: 12 }}
        />
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: '#E8F0FF' }}>{DUMMY_USER.displayName}</h1>
        <p style={{ margin: '2px 0 0', fontSize: 14, color: '#7A91BB' }}>{DUMMY_USER.email}</p>
        <p style={{ margin: '4px 0 0', fontSize: 12, color: '#5A6E94' }}>Tap photo to change</p>
      </div>

      {/* Stats grid */}
      <div style={{ margin: '0 16px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {[
          { label: 'Total Points',  value: DUMMY_STATS.pts,               color: '#FFB020' },
          { label: 'Predictions',   value: DUMMY_STATS.totalPredictions,   color: '#E8F0FF' },
          { label: 'Exact Scores',  value: DUMMY_STATS.exact,              color: '#FF4DA8' },
          { label: 'Accuracy',      value: `${DUMMY_STATS.accuracy}%`,     color: '#E8F0FF' },
        ].map(s => (
          <div key={s.label} style={{ borderRadius: 12, padding: 16, textAlign: 'center', background: '#0E1535', border: '1px solid rgba(255,255,255,0.07)' }}>
            <p style={{ margin: 0, fontSize: 28, fontWeight: 900, color: s.color, fontFamily: 'var(--font-barlow-condensed)' }}>{s.value}</p>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: '#7A91BB' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Logos + social */}
      <div style={{ margin: '0 16px 16px', display: 'flex', justifyContent: 'center', gap: 32 }}>

        {/* Mexillicious column */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/mexillicious-logo.png" alt="Mexillicious" style={{ width: 72, height: 72, objectFit: 'contain', opacity: 0.85 }} />
          <div style={{ display: 'flex', gap: 12 }}>
            <a href="https://tiktok.com/@mexillicious" target="_blank" rel="noopener noreferrer" style={{ color: '#778DA9', display: 'flex', alignItems: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.23 8.23 0 004.84 1.55V6.79a4.85 4.85 0 01-1.07-.1z"/></svg>
            </a>
            <a href="https://instagram.com/mexillicious" target="_blank" rel="noopener noreferrer" style={{ color: '#778DA9', display: 'flex', alignItems: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
            </a>
          </div>
        </div>

        {/* InchaStudios column */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 8, fontWeight: 900, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#778DA9', border: '1px solid rgba(119,141,169,0.35)', borderRadius: 4, padding: '2px 6px' }}>PARTNER</span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/inchalogo.png" alt="InchaStudios" style={{ width: 58, height: 50, objectFit: 'contain', filter: 'invert(1) brightness(0.75)' }} />
          <div style={{ display: 'flex', gap: 12 }}>
            <a href="https://tiktok.com/@inchastudios" target="_blank" rel="noopener noreferrer" style={{ color: '#778DA9', display: 'flex', alignItems: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.23 8.23 0 004.84 1.55V6.79a4.85 4.85 0 01-1.07-.1z"/></svg>
            </a>
            <a href="https://instagram.com/@inchastudios" target="_blank" rel="noopener noreferrer" style={{ color: '#778DA9', display: 'flex', alignItems: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
            </a>
          </div>
        </div>

      </div>

      {/* My Groups */}
      <div style={{ margin: '0 16px 16px' }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#5A6E94' }}>My Groups</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {DUMMY_GROUPS.map(g => (
            <div key={g.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: 12, padding: '12px 16px', background: '#0E1535', border: '1px solid rgba(255,255,255,0.07)' }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#E8F0FF' }}>{g.name}</span>
              <span style={{ fontSize: 12, color: '#7A91BB' }}>{g.members} members →</span>
            </div>
          ))}
        </div>
      </div>

      {/* Notifications */}
      <div style={{ margin: '0 16px 16px', borderRadius: 12, padding: '14px 16px', background: '#0E1535', border: '1px solid rgba(255,255,255,0.07)' }}>
        <h2 style={{ margin: '0 0 12px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#5A6E94' }}>Notifications</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,196,79,0.12)', border: '1px solid rgba(0,196,79,0.25)' }}>
            <span style={{ fontSize: 16 }}>🔔</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#E8F0FF' }}>Match Alerts</p>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: '#7A91BB' }}>Enabled and synced ✓</p>
          </div>
          <button style={{ flexShrink: 0, borderRadius: 20, padding: '6px 12px', fontSize: 12, fontWeight: 700, background: 'rgba(0,196,79,0.15)', color: '#00C44F', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}>
            Synced ✓
          </button>
        </div>
      </div>

      {/* Location */}
      <div style={{ margin: '0 16px 16px', borderRadius: 12, padding: 16, background: '#0E1535', border: '1px solid rgba(255,255,255,0.07)' }}>
        <h2 style={{ margin: '0 0 12px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#5A6E94' }}>Where are you from?</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderRadius: 8, padding: '8px 12px', background: 'rgba(255,255,255,0.04)' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`https://flagcdn.com/w40/${DUMMY_USER.countryCode}.png`} alt="" style={{ height: 16, width: 24, objectFit: 'cover', borderRadius: 2 }} />
          <span style={{ fontSize: 14, color: '#C8D0E0' }}>{DUMMY_USER.country}</span>
        </div>
      </div>

      {/* Scoring Rules */}
      <div style={{ margin: '0 16px 16px', borderRadius: 12, overflow: 'hidden', background: '#0E1535', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ padding: '16px 16px 12px' }}>
          <h2 style={{ margin: 0, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#5A6E94' }}>How Points Are Scored</h2>
        </div>

        {/* Score Predictions */}
        <div style={{ padding: '0 16px 4px' }}>
          <p style={{ margin: '0 0 8px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#FF4DA8' }}>Score Predictions</p>
          {[
            { pts: '+6', desc: 'Both scores exact (perfect)',  note: '3 + 3 pts' },
            { pts: '+3', desc: 'One score exact',              note: 'per correct team' },
            { pts: '+3', desc: 'Correct outcome (W / D / L)', note: 'if no exact score' },
          ].map(r => (
            <div key={r.desc} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: 14, color: '#C8D0E0' }}>{r.desc}</span>
                <span style={{ marginLeft: 6, fontSize: 10, color: '#5A6E94' }}>{r.note}</span>
              </div>
              <span style={{ marginLeft: 12, fontSize: 14, fontWeight: 900, color: '#FFB020', fontFamily: 'var(--font-barlow-condensed)', flexShrink: 0 }}>{r.pts}</span>
            </div>
          ))}
        </div>

        {/* Scorer Picks */}
        <div style={{ padding: '12px 16px 4px' }}>
          <p style={{ margin: '0 0 8px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#FF4DA8' }}>Scorer Picks</p>
          {[
            { pts: '+2', desc: 'Player you picked scores',        color: '#00C44F' },
            { pts: '−1', desc: "Player you picked doesn't score", color: '#FF4D4D' },
          ].map(r => (
            <div key={r.desc} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ fontSize: 14, color: '#C8D0E0' }}>{r.desc}</span>
              <span style={{ marginLeft: 12, fontSize: 14, fontWeight: 900, color: r.color, fontFamily: 'var(--font-barlow-condensed)', flexShrink: 0 }}>{r.pts}</span>
            </div>
          ))}
        </div>

        {/* Group Stage */}
        <div style={{ padding: '12px 16px 4px' }}>
          <p style={{ margin: '0 0 8px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#FF4DA8' }}>Group Stage Standings</p>
          {[
            { pts: '+3', desc: 'Group winner correct' },
            { pts: '+2', desc: 'Runner-up correct' },
            { pts: '+1', desc: '3rd place correct' },
          ].map(r => (
            <div key={r.desc} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ fontSize: 14, color: '#C8D0E0' }}>{r.desc}</span>
              <span style={{ marginLeft: 12, fontSize: 14, fontWeight: 900, color: '#FFB020', fontFamily: 'var(--font-barlow-condensed)', flexShrink: 0 }}>{r.pts}</span>
            </div>
          ))}
        </div>

        {/* Knockouts */}
        <div style={{ padding: '12px 16px 16px' }}>
          <p style={{ margin: '0 0 8px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#FF4DA8' }}>Knockout Stage</p>
          {[
            { pts: '+4',  desc: 'Correct finalist' },
            { pts: '+10', desc: 'Correct champion'  },
          ].map(r => (
            <div key={r.desc} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ fontSize: 14, color: '#C8D0E0' }}>{r.desc}</span>
              <span style={{ marginLeft: 12, fontSize: 14, fontWeight: 900, color: '#FFB020', fontFamily: 'var(--font-barlow-condensed)', flexShrink: 0 }}>{r.pts}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Sign out */}
      <button style={{ margin: '0 16px', borderRadius: 12, padding: '12px 0', fontSize: 14, fontWeight: 600, border: '1px solid rgba(0,196,79,0.25)', color: 'rgba(0,196,79,0.7)', background: 'none', cursor: 'pointer' }}>
        Sign Out
      </button>

      {/* Footer copyright */}
      <p style={{ margin: '20px 0 8px', textAlign: 'center', fontSize: 10, letterSpacing: '0.06em', color: '#7A91BB' }}>Mexillicious™ LLC 2026</p>

    </div>
  );
}
