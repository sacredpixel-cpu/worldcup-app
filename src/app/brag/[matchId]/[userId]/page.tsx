import { ALL_MATCHES } from '@/data/matches';
import { notFound } from 'next/navigation';
import nextDynamic from 'next/dynamic';

export const dynamic = 'force-dynamic';

const BragCardClient = nextDynamic(
  () => import('./BragCardClient').then(m => m.BragCardClient),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-screen items-center justify-center" style={{ background: '#06091A' }}>
        <div className="animate-pulse" style={{ color: '#7A91BB' }}>Loading…</div>
      </div>
    ),
  },
);

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: { matchId: string; userId: string };
  searchParams: { h?: string; a?: string; ph?: string; pa?: string };
}) {
  const match = ALL_MATCHES.find(m => m.id === params.matchId);
  if (!match) return {};

  const { h, a, ph, pa } = searchParams ?? {};

  const numH  = Number(h);
  const numA  = Number(a);
  const numPh = Number(ph);
  const numPa = Number(pa);

  const isPerfect = h && a && ph && pa && numPh === numH && numPa === numA;

  const home  = match.homeTeam.name;
  const away  = match.awayTeam.name;
  const score = h && a ? `${h}–${a}` : '';

  const title = isPerfect
    ? `I predicted the exact score: ${home} ${score} ${away} 🎯`
    : `I called the result: ${home} ${score} ${away} ✅`;
  const description = `Can you do better? Predict World Cup 2026 scores at MyWorldCupSchedule.com`;

  const qs = new URLSearchParams({
    m: params.matchId,
    h: h ?? '',
    a: a ?? '',
    ph: ph ?? '',
    pa: pa ?? '',
  }).toString();
  const imageUrl = `https://myworldcupschedule.com/api/brag-og?${qs}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: imageUrl, width: 1080, height: 1350, alt: title }],
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

export default function BragPage({
  params,
  searchParams,
}: {
  params: { matchId: string; userId: string };
  searchParams: { h?: string; a?: string; ph?: string; pa?: string };
}) {
  const match = ALL_MATCHES.find(m => m.id === params.matchId);
  if (!match) notFound();

  return (
    <BragCardClient
      matchId={params.matchId}
      userId={params.userId}
      match={match!}
    />
  );
}
