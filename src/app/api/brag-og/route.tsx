import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { ALL_MATCHES } from '@/data/matches';
import { teamDisplayCode } from '@/lib/utils/teamDisplayCode';
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

// Card is portrait 1080×1350 (4:5) matching the in-app card layout
const W = 1080;
const H = 1350;

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const matchId = searchParams.get('m') ?? '';
  const h = searchParams.get('h');
  const a = searchParams.get('a');
  const ph = searchParams.get('ph');
  const pa = searchParams.get('pa');

  const match = ALL_MATCHES.find(m => m.id === matchId);
  if (!match) return new Response('Not found', { status: 404 });

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
  const scoreColor = isPerfect ? '#FF4DA8' : '#FFFFFF';

  const predOutcome = Math.sign(numPh - numPa);
  let stmt1: string, stmt2: string, stmt3: string;
  if (isPerfect) {
    stmt1 = 'I PREDICTED THE'; stmt2 = 'EXACT FINAL'; stmt3 = 'SCORE';
  } else if (predOutcome === 0) {
    stmt1 = 'I PREDICTED'; stmt2 = 'IT ENDS IN'; stmt3 = 'A DRAW';
  } else {
    const winner = teamDisplayCode(predOutcome > 0 ? match.homeTeam.name : match.awayTeam.name);
    stmt1 = 'I PREDICTED'; stmt2 = `${winner} WOULD`; stmt3 = 'WIN';
  }

  const kickoff = new Date(match.kickoffAt);
  const matchDate = kickoff.toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC',
  });

  // Read portrait background from filesystem (1080×1350, ~155KB)
  const bgB64 = readPublicFileAsBase64('brag-bg-og.jpg');

  const [homeFlag, awayFlag] = await Promise.all([
    fetchAsBase64(match.homeTeam.flagUrl.replace('/w40/', '/w160/'), 4000),
    fetchAsBase64(match.awayTeam.flagUrl.replace('/w40/', '/w160/'), 4000),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: W, height: H,
          display: 'flex', flexDirection: 'column',
          fontFamily: 'sans-serif', overflow: 'hidden', position: 'relative',
        }}
      >
        {/* Background */}
        {bgB64 ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={bgB64}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 30%' }}
            alt=""
          />
        ) : (
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,#0a1628 0%,#0d2040 60%,#091520 100%)', display: 'flex' }} />
        )}

        {/* Dark overlay */}
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(5,10,18,0.58)', display: 'flex' }} />

        {/* Top accent bar */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 10, background: accent, display: 'flex' }} />

        {/* Upper content area — statement + team cards */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 220,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '60px 72px 32px',
          gap: 44,
        }}>
          {/* Header */}
          <div style={{ fontSize: 22, color: '#7AAEC8', fontWeight: 700, letterSpacing: 8, textTransform: 'uppercase', display: 'flex' }}>
            2026 FIFA World Cup
          </div>

          {/* Statement */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1.0 }}>
            <div style={{ fontSize: 26, color: '#5A90B0', fontWeight: 700, letterSpacing: 7, textTransform: 'uppercase', display: 'flex', marginBottom: 4 }}>
              {stmt1}
            </div>
            <div style={{ fontSize: 102, fontWeight: 900, color: '#FFFFFF', letterSpacing: 3, textTransform: 'uppercase', lineHeight: 1, display: 'flex' }}>
              {stmt2}
            </div>
            <div style={{ fontSize: 102, fontWeight: 900, color: accent, letterSpacing: 3, textTransform: 'uppercase', lineHeight: 1, display: 'flex' }}>
              {stmt3}
            </div>
          </div>

          {/* Team cards + score */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <div style={{ background: 'rgba(4,10,18,0.80)', borderRadius: 14, border: `2px solid ${accent}`, padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
              {homeFlag && <img src={homeFlag} width={54} height={36} style={{ objectFit: 'cover', borderRadius: 3 }} alt="" />}
              <div style={{ fontSize: 30, fontWeight: 800, color: '#FFFFFF', display: 'flex' }}>{teamDisplayCode(match.homeTeam.name)}</div>
            </div>
            <div style={{ fontSize: 88, fontWeight: 900, color: scoreColor, minWidth: 100, textAlign: 'center', lineHeight: 1, display: 'flex', justifyContent: 'center' }}>
              {`${h}–${a}`}
            </div>
            <div style={{ background: 'rgba(4,10,18,0.80)', borderRadius: 14, border: `2px solid ${accent}`, padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
              {awayFlag && <img src={awayFlag} width={54} height={36} style={{ objectFit: 'cover', borderRadius: 3 }} alt="" />}
              <div style={{ fontSize: 30, fontWeight: 800, color: '#FFFFFF', display: 'flex' }}>{teamDisplayCode(match.awayTeam.name)}</div>
            </div>
          </div>
        </div>

        {/* Dark footer panel — matches in-app card footer style */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 220, background: 'rgba(4,9,15,0.92)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
          <div style={{ width: '80%', height: 1, background: accent, display: 'flex' }} />
          <div style={{ fontSize: 22, color: '#6590AE', fontWeight: 500, display: 'flex' }}>
            {`${matchDate} · ${match.city}`}
          </div>
          <div style={{ width: '60%', height: 1, background: 'rgba(255,255,255,0.08)', display: 'flex' }} />
          <div style={{ fontSize: 24, color: '#FFFFFF', fontWeight: 700, letterSpacing: 4, textTransform: 'uppercase', display: 'flex' }}>
            only at MyWorldCupSchedule.com
          </div>
        </div>
      </div>
    ),
    { width: W, height: H },
  );
}
