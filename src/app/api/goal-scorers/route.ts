/**
 * Admin API — Goal Scorers
 *
 * POST /api/goal-scorers
 * Body:
 *   {
 *     secret:   string          — must match MATCH_UPDATE_SECRET env var
 *     action:   'upsert' | 'delete'
 *     id:       string          — unique doc ID, e.g. "mbappe-fra"
 *     player?:  string          — e.g. "Kylian Mbappé"       (required for upsert)
 *     team?:    string          — e.g. "France"               (required for upsert)
 *     teamCode?: string         — 3-letter code, e.g. "FRA"   (required for upsert)
 *     goals?:   number          — goal tally                  (required for upsert)
 *   }
 *
 * Example curl (upsert):
 *   curl -X POST https://your-app/api/goal-scorers \
 *     -H 'Content-Type: application/json' \
 *     -d '{"secret":"...","action":"upsert","id":"mbappe-fra","player":"Kylian Mbappé","team":"France","teamCode":"FRA","goals":3}'
 *
 * Example curl (delete):
 *   curl -X POST https://your-app/api/goal-scorers \
 *     -H 'Content-Type: application/json' \
 *     -d '{"secret":"...","action":"delete","id":"mbappe-fra"}'
 */

import { NextRequest, NextResponse } from 'next/server';
import { upsertGoalScorer, deleteGoalScorer } from '@/lib/matchesService';

export async function GET() {
  return NextResponse.json({ ok: true, endpoint: 'goal-scorers' });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      secret:    string;
      action:    'upsert' | 'delete';
      id:        string;
      player?:   string;
      team?:     string;
      teamCode?: string;
      goals?:    number;
    };

    const { secret, action, id } = body;

    if (!secret || secret !== process.env.MATCH_UPDATE_SECRET) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (!id) {
      return NextResponse.json({ ok: false, error: 'Missing id' }, { status: 400 });
    }

    if (action === 'delete') {
      await deleteGoalScorer(id);
      return NextResponse.json({ ok: true, deleted: id });
    }

    if (action === 'upsert') {
      const { player, team, teamCode, goals } = body;
      if (!player || !team || !teamCode || typeof goals !== 'number') {
        return NextResponse.json(
          { ok: false, error: 'Missing player, team, teamCode, or goals' },
          { status: 400 },
        );
      }
      await upsertGoalScorer(id, { player, team, teamCode, goals });
      return NextResponse.json({ ok: true, upserted: id });
    }

    return NextResponse.json({ ok: false, error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('goal-scorers error:', error);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}
