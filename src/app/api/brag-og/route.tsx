import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { ALL_MATCHES } from '@/data/matches';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function readPublicFileAsBase64(filename: string): string {
  try {
    const filePath = path.join(process.cwd(), 'public', filename);
    const buf = fs.readFileSync(filePath);
    const ext = filename.endsWith('.png') ? 'png' : 'jpeg';
    return `data:image/${ext};base64,${buf.toString('base64')}`;
  } catch {
    return '';
  }
}

async function fetchAsBase64(url: string, timeoutMs = 4000): Promise<string> {
  try {
    const res = await fetch(url, {
      cache: 'no-store',
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) return '';
    const buf = await res.arrayBuffer();
    const ext = url.endsWith('.png') ? 'png' : 'jpeg';
    return `data:image/${ext};base64,${Buffer.from(buf).toString('base64')}`;
  } catch {
    return '';
  }
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const matchId = searchParams.get('m') ?? '';
  const h = searchParams.get('h');
  const a = searchParams.get('a');
  const ph = searchParams.get('ph');
  const pa = searchParams.get('pa');

  const match = ALL_MATCHES.find(m => m.id === matchId);
  if (!match) return new Response('Not found', { status: 404 });

  // Validate numeric params
  if (h === null || a === null || ph === null || pa === null) {
    return new Response('Missing score params', { status: 400 });
  }
  const numH = Number(h), numA = Number(a), numPh = Number(ph), numPa = Number(pa);
  if ([numH, numA, numPh, numPa].some(isNaN)) {
    return new Response('Invalid score params', { status: 400 });
  }

  const isPerfect = numPh === numH && numPa === numA;
  const isCorrectOutcome = Math.sign(numPh - numPa) === Math.sign(numH - numA);

  if (!isCorrectOutcome) return new Response('Not eligible', { status: 400 });

  const accent = isPerfect ? '#FF4DA8' : '#1D9E75';

  // Statement text
  const predOutcome = Math.sign(numPh - numPa);
  let stmt1: string, stmt2: string, stmt3: string;
  if (isPerfect) {
    stmt1 = 'I PREDICTED THE'; stmt2 = 'EXACT FINAL'; stmt3 = 'SCORE';
  } else if (predOutcome === 0) {
    stmt1 = 'I PREDICTED'; stmt2 = 'IT ENDS IN'; stmt3 = 'A DRAW';
  } else {
    const winner = predOutcome > 0 ? match.homeTeam.name : match.awayTeam.name;
    stmt1 = 'I PREDICTED'; stmt2 = `${winner.toUpperCase()} WOULD`; stmt3 = 'WIN';
  }

  const kickoff = new Date(match.kickoffAt);
  const matchDate = kickoff.toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC',
  });

  // Read pre-resized background from filesystem (brag-bg-og.jpg is 1200x630 @ q60, ~81KB)
  const bgB64 = readPublicFileAsBase64('brag-bg-og.jpg');

  // Fetch flag images in parallel
  const [homeFlag, awayFlag] = await Promise.all([
    fetchAsBase64(match.homeTeam.flagUrl.replace('/w40/', '/w160/'), 4000),
    fetchAsBase64(match.awayTeam.flagUrl.replace('/w40/', '/w160/'), 4000),
  ]);

  const scoreColor = isPerfect ? '#FF4DA8' : '#FFFFFF';

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200, height: 630,
          display: 'flex', flexDirection: 'column',
          fontFamily: 'sans-serif', overflow: 'hidden', position: 'relative',
        }}
      >
        {/* Background image */}
        {bgB64 ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={bgB64}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
            alt=""
          />
        ) : (
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(160deg,#0a1628 0%,#0d2040 50%,#091520 100%)', display: 'flex' }} />
        )}

        {/* Dark overlay */}
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(5,10,18,0.65)', display: 'flex' }} />

        {/* Top accent bar */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 8, background: accent, display: 'flex' }} />

        {/* Main layout */}
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          padding: '40px 72px 32px',
        }}>
          {/* Header row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
            <span style={{ fontSize: 16, color: '#7AAEC8', fontWeight: 700, letterSpacing: 5, textTransform: 'uppercase' }}>
              2026 FIFA World Cup
            </span>
            <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>
              {matchDate} · {match.city}
            </span>
          </div>

          {/* Content row */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 64 }}>
            {/* Left: Statement + score */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 28 }}>
              {/* Statement text */}
              <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.05 }}>
                <span style={{ fontSize: 16, color: '#5A90B0', fontWeight: 700, letterSpacing: 6, textTransform: 'uppercase' }}>
                  {stmt1}
                </span>
                <span style={{ fontSize: 80, fontWeight: 900, color: '#FFFFFF', letterSpacing: 2 }}>
                  {stmt2}
                </span>
                <span style={{ fontSize: 80, fontWeight: 900, color: accent, letterSpacing: 2 }}>
                  {stmt3}
                </span>
              </div>

              {/* Team cards + actual score */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {/* Home team */}
                <div style={{
                  background: 'rgba(4,10,18,0.75)', borderRadius: 10,
                  border: `1.5px solid ${accent}`, padding: '10px 16px',
                  display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  {homeFlag ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={homeFlag} width={52} height={35} style={{ objectFit: 'cover', borderRadius: 3 }} alt="" />
                  ) : null}
                  <span style={{ fontSize: 24, fontWeight: 800, color: '#FFFFFF' }}>
                    {match.homeTeam.name}
                  </span>
                </div>

                <span style={{ fontSize: 72, fontWeight: 900, color: scoreColor, minWidth: 90, textAlign: 'center', lineHeight: 1 }}>
                  {h}–{a}
                </span>

                {/* Away team */}
                <div style={{
                  background: 'rgba(4,10,18,0.75)', borderRadius: 10,
                  border: `1.5px solid ${accent}`, padding: '10px 16px',
                  display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  {awayFlag ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={awayFlag} width={52} height={35} style={{ objectFit: 'cover', borderRadius: 3 }} alt="" />
                  ) : null}
                  <span style={{ fontSize: 24, fontWeight: 800, color: '#FFFFFF' }}>
                    {match.awayTeam.name}
                  </span>
                </div>
              </div>
            </div>

            {/* Vertical divider */}
            <div style={{ width: 1, height: 220, background: 'rgba(255,255,255,0.08)', display: 'flex' }} />

            {/* Right: CTA */}
            <div style={{ width: 260, display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 18, color: 'rgba(255,255,255,0.5)', fontWeight: 500, lineHeight: 1.4 }}>
                Think you can do better?
              </span>
              <span style={{ fontSize: 32, color: accent, fontWeight: 900, lineHeight: 1.2 }}>
                Make your prediction
              </span>
            </div>
          </div>

          {/* Footer */}
          <div style={{
            borderTop: '1px solid rgba(255,255,255,0.08)',
            paddingTop: 18,
            display: 'flex', justifyContent: 'flex-end', alignItems: 'center',
          }}>
            <span style={{ fontSize: 18, color: '#FFFFFF', fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase' }}>
              only at MyWorldCupSchedule.com
            </span>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
