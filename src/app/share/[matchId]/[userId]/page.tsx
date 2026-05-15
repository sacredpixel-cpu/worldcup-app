import { ALL_MATCHES } from '@/data/matches';
import { notFound } from 'next/navigation';
import dynamic from 'next/dynamic';

// SSR disabled — Firebase must only run in the browser
const SharePageClient = dynamic(
  () => import('./SharePageClient').then(m => m.SharePageClient),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-screen items-center justify-center bg-[#FBFAF7]">
        <div className="text-gray-400 animate-pulse">Loading…</div>
      </div>
    ),
  }
);

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: { matchId: string; userId: string };
  searchParams: { h?: string; a?: string };
}) {
  const match = ALL_MATCHES.find(m => m.id === params.matchId);
  if (!match) return {};

  const home = match.homeTeam.name;
  const away = match.awayTeam.name;
  const h = searchParams?.h ?? '?';
  const a = searchParams?.a ?? '?';
  const scoreText = h !== '?' && a !== '?' ? ` ${h}–${a}` : '';
  const title = `${home}${scoreText} ${away} — My World Cup 2026 Prediction`;
  const description = `Settle the scores at MyWorldCupSchedule.com — Follow the World Cup schedule, predict your own scores, and enjoy leaderboards and group challenges.`;

  // Pass score into OG image URL so it needs no Firebase
  const imageUrl = `https://myworldcupschedule.com/share/${params.matchId}/${params.userId}/opengraph-image?h=${h}&a=${a}`;
  const pageUrl = `https://myworldcupschedule.com/share/${params.matchId}/${params.userId}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: imageUrl, width: 1200, height: 630, alt: `${home} vs ${away} prediction` }],
      url: pageUrl,
      siteName: 'MyWorldCupSchedule.com',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default function SharePage({ params }: { params: { matchId: string; userId: string } }) {
  const match = ALL_MATCHES.find(m => m.id === params.matchId);
  if (!match) notFound();

  return <SharePageClient matchId={params.matchId} userId={params.userId} match={match!} />;
}
