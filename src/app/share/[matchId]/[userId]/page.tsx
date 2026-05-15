import { ALL_MATCHES } from '@/data/matches';
import { notFound } from 'next/navigation';
import dynamic from 'next/dynamic';

// Load client component with SSR disabled so Firebase never runs server-side
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

export async function generateMetadata({ params }: { params: { matchId: string; userId: string } }) {
  const match = ALL_MATCHES.find(m => m.id === params.matchId);
  if (!match) return {};

  const home = match.homeTeam.name;
  const away = match.awayTeam.name;
  const title = `${home} vs ${away} — My World Cup 2026 Prediction`;
  const description = `Settle the scores at MyWorldCupSchedule.com — Follow the World Cup schedule, predict your own scores, and enjoy leaderboards and group challenges.`;
  const imageUrl = `https://myworldcupschedule.com/share/${params.matchId}/${params.userId}/opengraph-image`;
  const pageUrl = `https://myworldcupschedule.com/share/${params.matchId}/${params.userId}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: imageUrl, width: 1200, height: 630 }],
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
