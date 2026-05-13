import { ImageResponse } from 'next/og';
import { ALL_MATCHES } from '@/data/matches';
import { getPrediction } from '@/lib/predictionsService';

export const runtime = 'nodejs';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OGImage({ params }: { params: { matchId: string; userId: string } }) {
  const match = ALL_MATCHES.find(m => m.id === params.matchId);
  if (!match) return new Response('Not found', { status: 404 });

  const pred = await getPrediction(params.userId, params.matchId);
  const home = match.homeTeam.name;
  const away = match.awayTeam.name;
  const homeFlag = `https://flagcdn.com/w160/${match.homeTeam.code.toLowerCase()}.png`;
  const awayFlag = `https://flagcdn.com/w160/${match.awayTeam.code.toLowerCase()}.png`;
  const score = pred ? `${pred.homeScore} – ${pred.awayScore}` : '? – ?';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%', height: '100%',
          background: 'linear-gradient(135deg, #0D0D0D 0%, #1A2A1A 100%)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          fontFamily: 'sans-serif', color: 'white', padding: '60px',
        }}
      >
        <p style={{ fontSize: 22, color: 'rgba(255,255,255,0.4)', letterSpacing: 4, marginBottom: 8, textTransform: 'uppercase' }}>
          FIFA World Cup 2026 · My Prediction
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: 60, marginTop: 40 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={homeFlag} width={120} height={80} style={{ objectFit: 'cover', borderRadius: 6 }} />
            <p style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>{home}</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <p style={{ fontSize: 80, fontWeight: 900, margin: 0, color: '#F5A623' }}>{score}</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={awayFlag} width={120} height={80} style={{ objectFit: 'cover', borderRadius: 6 }} />
            <p style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>{away}</p>
          </div>
        </div>

        <p style={{ fontSize: 20, color: 'rgba(255,255,255,0.3)', marginTop: 60 }}>
          worldcup-app-sooty.vercel.app · Make your own prediction!
        </p>
      </div>
    ),
    size,
  );
}
