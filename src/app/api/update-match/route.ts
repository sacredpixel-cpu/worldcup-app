import { NextRequest, NextResponse } from 'next/server';
import { updateMatchScore } from '@/lib/matchesService';

export async function GET() {
  return NextResponse.json({ ok: true });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      secret, matchId, homeScore, awayScore, status,
      homeScorers, awayScorers,
      regularTimeHomeScore, regularTimeAwayScore,
    } = body as {
      secret: string;
      matchId: string;
      homeScore: number;
      awayScore: number;
      status: 'live' | 'finished';
      homeScorers?: string[];
      awayScorers?: string[];
      /** 90-minute score for knockout matches that went to ET/penalties */
      regularTimeHomeScore?: number | null;
      regularTimeAwayScore?: number | null;
    };

    if (!secret || secret !== process.env.MATCH_UPDATE_SECRET) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (!matchId || typeof homeScore !== 'number' || typeof awayScore !== 'number' || !status) {
      return NextResponse.json({ ok: false, error: 'Missing required fields' }, { status: 400 });
    }

    if (!['live', 'finished'].includes(status)) {
      return NextResponse.json({ ok: false, error: 'Invalid status' }, { status: 400 });
    }

    await updateMatchScore(
      matchId, homeScore, awayScore, status,
      homeScorers, awayScorers,
      regularTimeHomeScore, regularTimeAwayScore,
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('update-match error:', error);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}
