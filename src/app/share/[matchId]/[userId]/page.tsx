import { ALL_MATCHES } from '@/data/matches';
import { notFound } from 'next/navigation';
import dynamic from 'next/dynamic';

// Force dynamic so searchParams (score) are always read fresh — never cached
export const dynamic = 'force-dynamic';

// SSR disabled — Firebase must only run in the browser
const SharePageClient = dynamic(
  () => import('./SharePageClient').then(m => m.SharePageClient),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-screen items-center justify-center" style={{ background: '#06091A' }}>
        <div className="animate-pulse" style={{ color: '#7A91BB' }}>Loading…</div>
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
  const description = `Can you beat my prediction? Predict scores, follow the schedule, and compete on leaderboards at MyWorldCupSchedule.com`;

  // Point directly at our API route — it reads ?m=&h=&a= from the request URL.
  // We intentionally omit og:url so Facebook uses the URL it fetched
  // (with score params intact) rather than following a canonical that strips them.
  const imageUrl = `https://myworldcupschedule.com/api/og?m=${params.matchId}&h=${h}&a=${a}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: imageUrl, width: 1200, height: 630, alt: `${home} vs ${away} — My World Cup 2026 Prediction` }],
      siteName: 'MyWorldCupSchedule.com',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default function SharePage({ params }: { params: { matchId: string; userId: string } }) {
  const match = ALL_MATCHES.find(m => m.id === params.matchId);
  if (!match) notFound();

  return <SharePageClient matchId={params.matchId} userId={params.userId} match={match!} />;
}
