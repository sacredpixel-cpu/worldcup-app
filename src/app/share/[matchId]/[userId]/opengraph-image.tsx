import { ImageResponse } from 'next/og';
import { ALL_MATCHES } from '@/data/matches';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// Flags via countryflagsapi — more reliable for server-side OG rendering
function flagUrl(code: string) {
  return `https://cdn.jsdelivr.net/gh/hampusborgos/country-flags@main/png250px/${code.toLowerCase()}.png`;
}

// Score is passed as ?h=2&a=1 — no Firebase needed server-side
export default async function OGImage({
  params,
  searchParams,
}: {
  params: { matchId: string; userId: string };
  searchParams: { h?: string; a?: string };
}) {
  const match = ALL_MATCHES.find(m => m.id === params.matchId);
  if (!match) return new Response('Not found', { status: 404 });

  const home = match.homeTeam.name;
  const away = match.awayTeam.name;
  const homeScore = searchParams?.h ?? '?';
  const awayScore = searchParams?.a ?? '?';

  // Format kickoff date in local-friendly style, e.g. "Jun 11, 2026"
  const kickoff = new Date(match.kickoffAt);
  const matchDate = kickoff.toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC',
  });
  const matchLocation = `${match.venue} · ${match.city}`;

  const homeFlagSrc = flagUrl(match.homeTeam.code);
  const awayFlagSrc = flagUrl(match.awayTeam.code);

  // Fetch flag images as base64 so they always render
  async function fetchFlag(url: string): Promise<string> {
    try {
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) return '';
      const buf = await res.arrayBuffer();
      const b64 = Buffer.from(buf).toString('base64');
      return `data:image/png;base64,${b64}`;
    } catch {
      return '';
    }
  }

  const [homeFlag, awayFlag] = await Promise.all([
    fetchFlag(homeFlagSrc),
    fetchFlag(awayFlagSrc),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#06091A',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'sans-serif',
          overflow: 'hidden',
        }}
      >
        {/* Top accent bar */}
        <div style={{
          background: 'linear-gradient(90deg, #FF1F8E 0%, #C4157A 100%)',
          height: 8,
          width: '100%',
          display: 'flex',
        }} />

        {/* Header */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          paddingTop: 32,
          paddingBottom: 0,
          gap: 8,
        }}>
          <span style={{ fontSize: 34, color: '#FF1F8E', fontWeight: 900, letterSpacing: 4, textTransform: 'uppercase' }}>
            My Prediction · World Cup 2026
          </span>
          <span style={{ fontSize: 20, color: 'rgba(255,255,255,0.4)', fontWeight: 600, letterSpacing: 1 }}>
            {matchDate} &nbsp;·&nbsp; {matchLocation}
          </span>
        </div>

        {/* Main content */}
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px 80px',
          gap: 0,
        }}>
          {/* Home team */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, flex: 1 }}>
            {homeFlag ? (
              <img
                src={homeFlag}
                width={200}
                height={133}
                style={{ objectFit: 'cover', borderRadius: 10, boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}
              />
            ) : (
              <div style={{ width: 200, height: 133, borderRadius: 10, background: '#0E1535', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 48, color: '#7A91BB' }}>🏴</span>
              </div>
            )}
            <span style={{ fontSize: 32, fontWeight: 800, color: '#E8F0FF', textAlign: 'center' }}>{home}</span>
          </div>

          {/* Score */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
            padding: '0 48px',
          }}>
            <div style={{
              background: 'rgba(255,31,142,0.12)',
              border: '2px solid rgba(255,31,142,0.4)',
              borderRadius: 24,
              padding: '20px 52px',
              display: 'flex',
              alignItems: 'center',
              gap: 16,
            }}>
              <span style={{ fontSize: 120, fontWeight: 900, color: '#FF1F8E', lineHeight: 1 }}>{homeScore}</span>
              <span style={{ fontSize: 72, fontWeight: 300, color: 'rgba(255,255,255,0.2)', lineHeight: 1 }}>–</span>
              <span style={{ fontSize: 120, fontWeight: 900, color: '#FF1F8E', lineHeight: 1 }}>{awayScore}</span>
            </div>
            <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.35)', fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase' }}>
              Predicted Score
            </span>
          </div>

          {/* Away team */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, flex: 1 }}>
            {awayFlag ? (
              <img
                src={awayFlag}
                width={200}
                height={133}
                style={{ objectFit: 'cover', borderRadius: 10, boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}
              />
            ) : (
              <div style={{ width: 200, height: 133, borderRadius: 10, background: '#0E1535', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 48, color: '#7A91BB' }}>🏴</span>
              </div>
            )}
            <span style={{ fontSize: 32, fontWeight: 800, color: '#E8F0FF', textAlign: 'center' }}>{away}</span>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          background: 'rgba(255,255,255,0.04)',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 60px',
        }}>
          <span style={{ fontSize: 20, color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>
            Can you do better? Make your prediction at
          </span>
          <span style={{ fontSize: 24, color: '#FF1F8E', fontWeight: 800, letterSpacing: 0.5 }}>
            myworldcupschedule.com
          </span>
        </div>
      </div>
    ),
    size,
  );
}
