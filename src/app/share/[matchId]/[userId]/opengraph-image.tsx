import { ImageResponse } from 'next/og';
import { ALL_MATCHES } from '@/data/matches';
import { getPrediction } from '@/lib/predictionsService';

export const runtime = 'nodejs';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OGImage({ params }: { params: { matchId: string; userId: string } }) {
  const match = ALL_MATCHES.find(m => m.id === params.matchId);
  if (!match) return new Response('Not found', { status: 404 });

  let pred = null;
  try { pred = await getPrediction(params.userId, params.matchId); } catch {}
  const home = match.homeTeam.name;
  const away = match.awayTeam.name;
  const homeFlag = `https://flagcdn.com/w160/${match.homeTeam.code.toLowerCase()}.png`;
  const awayFlag = `https://flagcdn.com/w160/${match.awayTeam.code.toLowerCase()}.png`;
  const homeScore = pred?.homeScore ?? '?';
  const awayScore = pred?.awayScore ?? '?';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#FBFAF7',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'sans-serif',
          overflow: 'hidden',
        }}
      >
        {/* Pink header bar */}
        <div style={{
          background: 'linear-gradient(90deg, #E91E8C 0%, #C4157A 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '22px 60px',
          gap: 16,
        }}>
          <span style={{ fontSize: 28, color: 'white', fontWeight: 900, letterSpacing: 3, textTransform: 'uppercase' }}>
            ⚽ FIFA World Cup 2026 · My Prediction
          </span>
        </div>

        {/* Main content */}
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 0,
          padding: '30px 80px',
        }}>
          {/* Home team */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, flex: 1 }}>
            <img
              src={homeFlag}
              width={160}
              height={107}
              style={{ objectFit: 'cover', borderRadius: 8, boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}
            />
            <span style={{ fontSize: 30, fontWeight: 800, color: '#1A1A1A', textAlign: 'center' }}>{home}</span>
          </div>

          {/* Score */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
            padding: '0 40px',
          }}>
            <div style={{
              background: 'white',
              border: '3px solid #E2DDD8',
              borderRadius: 20,
              padding: '16px 40px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              boxShadow: '0 4px 24px rgba(233,30,140,0.12)',
            }}>
              <span style={{ fontSize: 96, fontWeight: 900, color: '#E91E8C', lineHeight: 1 }}>{homeScore}</span>
              <span style={{ fontSize: 60, fontWeight: 300, color: '#B0A9A3', lineHeight: 1 }}>–</span>
              <span style={{ fontSize: 96, fontWeight: 900, color: '#E91E8C', lineHeight: 1 }}>{awayScore}</span>
            </div>
            <span style={{ fontSize: 18, color: '#9CA3AF', fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase', marginTop: 6 }}>
              Predicted Score
            </span>
          </div>

          {/* Away team */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, flex: 1 }}>
            <img
              src={awayFlag}
              width={160}
              height={107}
              style={{ objectFit: 'cover', borderRadius: 8, boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}
            />
            <span style={{ fontSize: 30, fontWeight: 800, color: '#1A1A1A', textAlign: 'center' }}>{away}</span>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          background: '#1A1A1A',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '18px 60px',
        }}>
          <span style={{ fontSize: 20, color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>
            Settle the scores — predict your own at
          </span>
          <span style={{ fontSize: 22, color: '#E91E8C', fontWeight: 800, letterSpacing: 0.5 }}>
            myworldcupschedule.com
          </span>
        </div>
      </div>
    ),
    size,
  );
}
