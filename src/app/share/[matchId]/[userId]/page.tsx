import { ALL_MATCHES } from '@/data/matches';
import { getPrediction } from '@/lib/predictionsService';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export async function generateMetadata({ params }: { params: { matchId: string; userId: string } }) {
  const match = ALL_MATCHES.find(m => m.id === params.matchId);
  if (!match) return {};
  const pred = await getPrediction(params.userId, params.matchId);
  const home = match.homeTeam.name;
  const away = match.awayTeam.name;
  const score = pred ? `${pred.homeScore}–${pred.awayScore}` : '?–?';
  return {
    title: `My prediction: ${home} ${score} ${away} | World Cup 2026`,
    description: `I'm predicting ${home} ${score} ${away} at the 2026 FIFA World Cup. Make your own predictions!`,
    openGraph: {
      title: `${home} ${score} ${away}`,
      description: `My World Cup 2026 prediction — join me!`,
      images: [`/share/${params.matchId}/${params.userId}/og.png`],
    },
  };
}

export default async function SharePage({ params }: { params: { matchId: string; userId: string } }) {
  const match = ALL_MATCHES.find(m => m.id === params.matchId);
  if (!match) notFound();

  const pred = await getPrediction(params.userId, params.matchId);
  const home = match.homeTeam.name;
  const away = match.awayTeam.name;
  const homeFlag = `https://flagcdn.com/w80/${match.homeTeam.code.toLowerCase()}.png`;
  const awayFlag = `https://flagcdn.com/w80/${match.awayTeam.code.toLowerCase()}.png`;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#FBFAF7] px-6">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-white p-6 text-center shadow-sm">
        <p className="mb-1 text-xs uppercase tracking-widest text-gray-400">FIFA World Cup 2026</p>
        <p className="mb-6 text-xs text-gray-400">My Prediction</p>

        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-1 flex-col items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={homeFlag} alt={home} className="h-10 w-14 object-cover rounded-sm" />
            <p className="text-sm font-bold text-gray-900">{home}</p>
          </div>

          <div className="flex flex-col items-center">
            {pred ? (
              <p className="text-4xl font-black text-gray-900">{pred.homeScore}–{pred.awayScore}</p>
            ) : (
              <p className="text-2xl font-bold text-gray-400">?–?</p>
            )}
          </div>

          <div className="flex flex-1 flex-col items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={awayFlag} alt={away} className="h-10 w-14 object-cover rounded-sm" />
            <p className="text-sm font-bold text-gray-900">{away}</p>
          </div>
        </div>

        <div className="mt-6 border-t border-border pt-4">
          <p className="text-xs text-gray-400 mb-3">Think you can do better?</p>
          <Link
            href="https://worldcup-app-sooty.vercel.app/schedule"
            className="block w-full rounded-xl bg-brand py-3 text-sm font-bold text-white"
          >
            Make Your Prediction →
          </Link>
        </div>
      </div>
    </div>
  );
}
