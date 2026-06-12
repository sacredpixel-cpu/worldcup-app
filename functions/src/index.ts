/**
 * World Cup 2026 — Firebase Cloud Functions
 *
 *  1. notify24hrReminder   — Scheduled every 30 min. Finds any match whose
 *                            kickoff is 24 hours away and sends a reminder.
 *
 *  2. onMatchStatusChange  — Firestore trigger on matches/{matchId}.
 *                            Sends kickoff / full-time notifications.
 *
 *  3. pollLiveScores       — Scheduled every 2 min. Calls RapidAPI
 *                            "Free API Live Football Data" to get live WC
 *                            scores and writes them to Firestore.
 *                            The onMatchStatusChange trigger then fires
 *                            notifications automatically.
 *
 * Deploy:
 *   # One-time secret setup (run from project root):
 *   firebase functions:secrets:set RAPIDAPI_KEY
 *   # Then: cd functions && npm run build && firebase deploy --only functions
 */

import * as admin from 'firebase-admin';
import { onSchedule }         from 'firebase-functions/v2/scheduler';
import { onDocumentUpdated }  from 'firebase-functions/v2/firestore';
import { defineSecret }       from 'firebase-functions/params';
import type { MulticastMessage } from 'firebase-admin/messaging';
import fetch                  from 'node-fetch';
import { MATCH_SCHEDULE }     from './schedule';

const RAPIDAPI_KEY = defineSecret('RAPIDAPI_KEY');

admin.initializeApp();

const db  = admin.firestore();
const fcm = admin.messaging();

// Base URL of the deployed web app
const APP_URL = 'https://worldcup-2026-43ab4.web.app';
const ICON    = `${APP_URL}/mexillicious-logo.png`;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Fetches all enabled FCM tokens from Firestore. */
async function getAllTokens(): Promise<string[]> {
  const snap = await db
    .collection('fcmTokens')
    .where('enabled', '==', true)
    .get();
  return snap.docs.map((d) => d.data().token as string).filter(Boolean);
}

/**
 * Sends a multicast FCM message batched in groups of ≤500 (FCM limit).
 * Automatically removes stale/unregistered tokens from Firestore.
 */
async function broadcast(message: Omit<MulticastMessage, 'tokens'>): Promise<void> {
  const tokens = await getAllTokens();
  if (tokens.length === 0) {
    console.log('No opted-in tokens — skipping broadcast.');
    return;
  }

  for (let i = 0; i < tokens.length; i += 500) {
    const chunk    = tokens.slice(i, i + 500);
    const response = await fcm.sendEachForMulticast({ ...message, tokens: chunk });

    // Clean up tokens FCM says are no longer valid
    const stale: Promise<unknown>[] = [];
    response.responses.forEach((resp, idx) => {
      if (
        !resp.success &&
        resp.error?.code === 'messaging/registration-token-not-registered'
      ) {
        stale.push(db.collection('fcmTokens').doc(chunk[idx]).delete());
      }
    });
    await Promise.all(stale);

    console.log(
      `Batch ${i / 500 + 1}: ${response.successCount} sent, ` +
      `${response.failureCount} failed, ${stale.length} tokens cleaned.`
    );
  }
}

/** Builds consistent webpush + apns options for every notification. */
function webpushOptions(url: string, tag: string) {
  return {
    webpush: {
      notification: { icon: ICON, badge: ICON, tag, requireInteraction: false },
      fcmOptions:   { link: `${APP_URL}${url}` },
    },
    apns: {
      payload: { aps: { sound: 'default', badge: 1 } },
    },
  };
}

// ─── 1. 24-Hour Reminder ─────────────────────────────────────────────────────

/**
 * Runs every 30 minutes. For each match in the static schedule, checks
 * whether the 24-hour mark falls within the current 30-minute window.
 * Uses a Firestore sentinel document to guarantee exactly-once delivery.
 */
export const notify24hrReminder = onSchedule('every 30 minutes', async () => {
  const now         = Date.now();
  const windowStart = now + 23 * 60 * 60 * 1000;          // now + 23 h
  const windowEnd   = now + 24 * 60 * 60 * 1000;          // now + 24 h

  const matchesToNotify = Object.entries(MATCH_SCHEDULE).filter(([, entry]) => {
    const kickoff = new Date(entry.kickoffAt).getTime();
    return kickoff >= windowStart && kickoff < windowEnd;
  });

  if (matchesToNotify.length === 0) {
    console.log('No matches in the 24-hr window.');
    return;
  }

  for (const [matchId, entry] of matchesToNotify) {
    // De-dupe: skip if we already sent this notification
    const sentRef = db.doc(`notificationsSent/${matchId}_24hr`);
    const sentDoc = await sentRef.get();
    if (sentDoc.exists) {
      console.log(`24hr reminder already sent for ${matchId}, skipping.`);
      continue;
    }

    const teamsKnown = entry.home !== '' && entry.away !== '';
    const title = teamsKnown
      ? `⏰ 24hrs to Kickoff: ${entry.home} vs ${entry.away}`
      : '⏰ 24hrs to Kickoff!';
    const body = teamsKnown
      ? `${entry.home} vs ${entry.away} kicks off in 24 hours. Set your score prediction before it locks!`
      : 'A World Cup 2026 match kicks off in 24 hours. Set your prediction before it locks!';

    await broadcast({
      notification: { title, body },
      data: { matchId, url: '/schedule', type: '24hr' },
      ...webpushOptions('/schedule', `reminder-24hr-${matchId}`),
      android: {
        notification: { icon: 'ic_notification', priority: 'high' },
      },
    });

    // Mark as sent so we don't fire again if the scheduler overlaps
    await sentRef.set({ sentAt: admin.firestore.FieldValue.serverTimestamp(), matchId });
    console.log(`24hr reminder sent for ${matchId} (${entry.home} vs ${entry.away}).`);
  }
});

// ─── 2, 3 & 4. Kickoff + Full-Time + Upset Alert ─────────────────────────────

/** FIFA codes of traditional powerhouse nations used for upset detection. */
const POWERHOUSES = new Set(['BRA','FRA','ARG','ENG','ESP','DEU','PRT','NLD','BEL']);

/** Maps all WC 2026 schedule team names → 3-letter FIFA codes. */
const TEAM_NAME_TO_CODE: Record<string, string> = {
  // Group A
  'Mexico': 'MEX', 'South Africa': 'ZAF', 'South Korea': 'KOR', 'Czechia': 'CZE',
  // Group B
  'Canada': 'CAN', 'Bosnia & Herzegovina': 'BIH', 'Qatar': 'QAT', 'Switzerland': 'CHE',
  // Group C
  'Brazil': 'BRA', 'Morocco': 'MAR', 'Haiti': 'HAI', 'Scotland': 'SCO',
  // Group D
  'USA': 'USA', 'Paraguay': 'PRY', 'Australia': 'AUS', 'Türkiye': 'TUR',
  // Group E
  'Germany': 'DEU', 'Curaçao': 'CUW', "Côte d'Ivoire": 'CIV', 'Ecuador': 'ECU',
  // Group F
  'Netherlands': 'NLD', 'Japan': 'JPN', 'Sweden': 'SWE', 'Tunisia': 'TUN',
  // Group G
  'Belgium': 'BEL', 'Egypt': 'EGY', 'Iran': 'IRN', 'New Zealand': 'NZL',
  // Group H
  'Spain': 'ESP', 'Cape Verde': 'CPV', 'Saudi Arabia': 'SAU', 'Uruguay': 'URU',
  // Group I
  'France': 'FRA', 'Senegal': 'SEN', 'Iraq': 'IRQ', 'Norway': 'NOR',
  // Group J
  'Argentina': 'ARG', 'Algeria': 'DZA', 'Austria': 'AUT', 'Jordan': 'JOR',
  // Group K
  'Portugal': 'PRT', 'DR Congo': 'COD', 'Uzbekistan': 'UZB', 'Colombia': 'COL',
  // Group L
  'England': 'ENG', 'Croatia': 'HRV', 'Ghana': 'GHA', 'Panama': 'PAN',
};

function isPowerhouse(teamName: string): boolean {
  const code = TEAM_NAME_TO_CODE[teamName];
  return code !== undefined && POWERHOUSES.has(code);
}

/**
 * Fires whenever a document in matches/{matchId} is updated.
 *   status → "live"     → predictions locked + upset-live alert
 *   status → "finished" → final score + upset-win alert
 */
export const onMatchStatusChange = onDocumentUpdated(
  'matches/{matchId}',
  async (event) => {
    const before = event.data?.before.data();
    const after  = event.data?.after.data();
    if (!before || !after) return;

    const prevStatus    = before.status as string | undefined;
    const newStatus     = after.status  as string | undefined;
    const statusChanged = prevStatus !== newStatus;

    const matchId    = event.params.matchId;
    const entry      = MATCH_SCHEDULE[matchId];
    const teamsKnown = entry?.home && entry?.away;

    // ── 2. Match kicked off — predictions are now locked ──────────────────
    if (statusChanged && newStatus === 'live') {
      const title = teamsKnown
        ? `🔒 ${entry.home} vs ${entry.away} — Predictions Locked`
        : '🔒 Match Started — Predictions Locked';
      const body = teamsKnown
        ? `${entry.home} vs ${entry.away} has kicked off. Predictions are locked — check yours now!`
        : 'The match has kicked off. Predictions are locked — check yours now!';

      await broadcast({
        notification: { title, body },
        data: { matchId, url: '/predictions', type: 'kickoff' },
        ...webpushOptions('/predictions', `kickoff-${matchId}`),
        android: {
          notification: { icon: 'ic_notification', priority: 'default' },
        },
      });

      console.log(`Kickoff notification sent for ${matchId}.`);
    }

    // ── 3. Match finished — show final score ──────────────────────────────
    if (statusChanged && newStatus === 'finished') {
      const homeScore = after.homeScore ?? '?';
      const awayScore = after.awayScore ?? '?';

      const scoreStr = `${homeScore}–${awayScore}`;
      const title = teamsKnown
        ? `🏁 Full Time: ${entry.home} ${scoreStr} ${entry.away}`
        : `🏁 Full Time: ${scoreStr}`;
      const body = teamsKnown
        ? `${entry.home} ${scoreStr} ${entry.away} — see how your prediction scored!`
        : `Final score ${scoreStr} — see how your prediction scored!`;

      await broadcast({
        notification: { title, body },
        data: { matchId, url: '/predictions', type: 'fulltime' },
        ...webpushOptions('/predictions', `fulltime-${matchId}`),
        android: {
          notification: { icon: 'ic_notification', priority: 'default' },
        },
      });

      console.log(`Full-time notification sent for ${matchId} (${scoreStr}).`);
    }

    // ── 4. Goal scored — live score update with scorer name ───────────────
    // Fires on score changes while the match is active (status stays 'live',
    // 'halftime', 'extratime', or 'penalties').  A per-scoreline sentinel doc
    // prevents duplicate notifications if the trigger fires more than once.
    const isActive =
      newStatus === 'live' || newStatus === 'halftime' ||
      newStatus === 'extratime' || newStatus === 'penalties';

    if (isActive && teamsKnown) {
      const prevHome = typeof before.homeScore === 'number' ? before.homeScore : -1;
      const prevAway = typeof before.awayScore === 'number' ? before.awayScore : -1;
      const newHome  = typeof after.homeScore  === 'number' ? after.homeScore  : -1;
      const newAway  = typeof after.awayScore  === 'number' ? after.awayScore  : -1;

      if ((newHome > prevHome || newAway > prevAway) && newHome >= 0 && newAway >= 0) {
        const scoreStr = `${newHome}–${newAway}`;
        const goalSentinel = db.doc(`notificationsSent/${matchId}_goal_${newHome}_${newAway}`);

        if (!(await goalSentinel.get()).exists) {
          // Determine which team scored
          const scoringTeam = newHome > prevHome ? (entry.home as string) : (entry.away as string);

          // Try to identify the scorer from goalScorerEvents diff
          type ScorerEvent = { player: string; teamCode: string; goals: number };
          const beforeEvts = (before.goalScorerEvents ?? []) as ScorerEvent[];
          const afterEvts  = (after.goalScorerEvents  ?? []) as ScorerEvent[];
          const beforeMap  = new Map(beforeEvts.map(e => [`${e.player}::${e.teamCode}`, e.goals]));

          let newScorer: string | null = null;
          for (const ev of afterEvts) {
            const prevGoals = beforeMap.get(`${ev.player}::${ev.teamCode}`) ?? 0;
            if (ev.goals > prevGoals) { newScorer = ev.player; break; }
          }

          const title = `⚽ GOAL! ${entry.home} ${scoreStr} ${entry.away}`;
          const body  = newScorer
            ? `${newScorer} scores for ${scoringTeam}!`
            : `${scoringTeam} score! ${scoreStr}`;

          await broadcast({
            notification: { title, body },
            data: { matchId, url: '/scores', type: 'goal' },
            ...webpushOptions('/scores', `goal-${matchId}-${newHome}-${newAway}`),
            android: { notification: { icon: 'ic_notification', priority: 'high' } },
          });

          await goalSentinel.set({ sentAt: admin.firestore.FieldValue.serverTimestamp() });
          console.log(`Goal notification: ${title} — ${body}`);
        }
      }
    }

    // ── 5. Upset alert ────────────────────────────────────────────────────
    if (teamsKnown) {
      const home      = entry.home as string;
      const away      = entry.away as string;
      const homeScore = typeof after.homeScore === 'number' ? after.homeScore : null;
      const awayScore = typeof after.awayScore === 'number' ? after.awayScore : null;

      const homePower = isPowerhouse(home);
      const awayPower = isPowerhouse(away);

      // Only fire when exactly one side is a powerhouse and scores are available
      if (homePower !== awayPower && homeScore !== null && awayScore !== null) {
        const powerhouse = homePower ? home : away;
        const underdog   = homePower ? away : home;
        const scoreStr   = `${homeScore}–${awayScore}`;

        // Underdog is ahead (home is underdog → homeScore > awayScore, or vice versa)
        const underdogAhead =
          (homePower && awayScore > homeScore) ||
          (awayPower && homeScore > awayScore);

        if (isActive && underdogAhead) {
          const sentRef = db.doc(`notificationsSent/${matchId}_upset_live`);
          if (!(await sentRef.get()).exists) {
            await broadcast({
              notification: {
                title: '🚨 Upset Alert!',
                body:  `${underdog} is leading ${powerhouse} ${scoreStr} (Live)`,
              },
              data: { matchId, url: '/schedule', type: 'upset_live' },
              ...webpushOptions('/schedule', `upset-live-${matchId}`),
              android: { notification: { icon: 'ic_notification', priority: 'high' } },
            });
            await sentRef.set({ sentAt: admin.firestore.FieldValue.serverTimestamp(), matchId });
            console.log(`Upset-live alert: ${underdog} leads ${powerhouse} in ${matchId}.`);
          }
        }

        if (statusChanged && newStatus === 'finished' && underdogAhead) {
          const sentRef = db.doc(`notificationsSent/${matchId}_upset_win`);
          if (!(await sentRef.get()).exists) {
            await broadcast({
              notification: {
                title: '🚨 Upset!',
                body:  `${underdog} def. ${powerhouse} ${scoreStr} — Shock result!`,
              },
              data: { matchId, url: '/schedule', type: 'upset_win' },
              ...webpushOptions('/schedule', `upset-win-${matchId}`),
              android: { notification: { icon: 'ic_notification', priority: 'high' } },
            });
            await sentRef.set({ sentAt: admin.firestore.FieldValue.serverTimestamp(), matchId });
            console.log(`Upset-win alert: ${underdog} beat ${powerhouse} in ${matchId}.`);
          }
        }
      }
    }
  }
);

// ─── 4. Morning-After Results Digest ─────────────────────────────────────────

/**
 * Runs daily at 11:00 AM UTC (7 AM ET). Finds all matches that finished
 * yesterday (UTC), fetches their scores from Firestore, and sends a single
 * digest push notification to all opted-in users.
 *
 * A sentinel doc `notificationsSent/{date}_digest` prevents duplicate sends
 * if the function is retried or the scheduler fires more than once.
 *
 * Only active during the tournament window (Jun 11 – Jul 19 2026).
 */
export const morningResultsDigest = onSchedule(
  {
    schedule: '0 11 * * *',
    timeZone: 'UTC',
    timeoutSeconds: 60,
    memory: '256MiB',
  },
  async () => {
    const now = new Date();
    const tournamentStart = new Date('2026-06-11T00:00:00Z');
    const tournamentEnd   = new Date('2026-07-20T00:00:00Z');
    if (now < tournamentStart || now > tournamentEnd) {
      console.log('Outside tournament window — skipping digest.');
      return;
    }

    // "Yesterday" in UTC
    const yesterday = new Date(now);
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    const yDateStr = yesterday.toISOString().slice(0, 10); // "YYYY-MM-DD"

    // De-dupe guard
    const sentRef = db.doc(`notificationsSent/${yDateStr}_digest`);
    if ((await sentRef.get()).exists) {
      console.log(`Digest for ${yDateStr} already sent — skipping.`);
      return;
    }

    // Find all schedule entries whose kickoff was on yesterday (UTC date)
    const yesterdayMatches = Object.entries(MATCH_SCHEDULE).filter(([, entry]) => {
      return entry.kickoffAt.startsWith(yDateStr);
    });

    if (yesterdayMatches.length === 0) {
      console.log(`No scheduled matches on ${yDateStr} — no digest to send.`);
      return;
    }

    // Fetch Firestore docs for those matches in parallel
    const docs = await Promise.all(
      yesterdayMatches.map(([matchId]) =>
        db.collection('matches').doc(matchId).get()
      )
    );

    // Keep only matches that actually finished
    const results: { home: string; away: string; homeScore: number; awayScore: number }[] = [];
    for (let i = 0; i < yesterdayMatches.length; i++) {
      const [, entry] = yesterdayMatches[i];
      const data = docs[i].data();
      if (!data || data.status !== 'finished') continue;
      if (data.homeScore == null || data.awayScore == null) continue;
      results.push({
        home:      entry.home || 'TBD',
        away:      entry.away || 'TBD',
        homeScore: data.homeScore as number,
        awayScore: data.awayScore as number,
      });
    }

    if (results.length === 0) {
      console.log(`No finished matches found for ${yDateStr} — skipping digest.`);
      return;
    }

    // Build body: up to 3 results, then "& N more"
    const MAX_SHOWN = 3;
    const shown = results.slice(0, MAX_SHOWN);
    const extra = results.length - shown.length;
    const scoreLine = (r: typeof shown[0]) =>
      `${r.home} ${r.homeScore}–${r.awayScore} ${r.away}`;
    let body = shown.map(scoreLine).join(' · ');
    if (extra > 0) body += ` & ${extra} more`;

    await broadcast({
      notification: {
        title: '⚽ Yesterday\'s WC Results',
        body,
      },
      data: { url: '/schedule', type: 'digest', date: yDateStr },
      ...webpushOptions('/schedule', `digest-${yDateStr}`),
      android: {
        notification: { icon: 'ic_notification', priority: 'default' },
      },
    });

    await sentRef.set({
      sentAt:       admin.firestore.FieldValue.serverTimestamp(),
      date:         yDateStr,
      matchCount:   results.length,
    });

    console.log(`Digest sent for ${yDateStr}: ${results.length} result(s) — "${body}"`);
  }
);

// ─── 3. Live Score Poller ─────────────────────────────────────────────────────

/**
 * RapidAPI "Free API Live Football Data" — used for scores & status.
 * WC 2026 group stage is leagueId 894790.
 * Endpoint: football-get-matches-by-date?date=YYYYMMDD
 */
const RAPIDAPI_HOST    = 'free-api-live-football-data.p.rapidapi.com';
const RAPIDAPI_BY_DATE = `https://${RAPIDAPI_HOST}/football-get-matches-by-date`;
const WC_2026_LEAGUE_ID = 894790;

/**
 * ESPN public scoreboard + summary — used ONLY for goal scorer data.
 * No API key required.
 */
const ESPN_WC_SCOREBOARD =
  'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard';
const ESPN_WC_SUMMARY =
  'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/summary';

// ── RapidAPI response types ───────────────────────────────────────────────────

interface RapidMatch {
  id:       number;
  leagueId: number;
  home:     { id: number; name: string; longName: string; score: number };
  away:     { id: number; name: string; longName: string; score: number };
  status: {
    utcTime:   string;
    started:   boolean;
    finished:  boolean;
    cancelled: boolean;
    awarded:   boolean;
    reason?: {
      short:    string;  // "FT" | "HT" | "AET" | "Pen" | "Live" | "Sched" …
      shortKey: string;
      long:     string;
      longKey:  string;
    };
  };
  statusId: number;
}

interface RapidMatchesResponse {
  status:   number;
  response: { matches: RapidMatch[] };
}

/** Maps a RapidAPI match status → our Firestore status string. */
function rapidToAppStatus(m: RapidMatch): string {
  const { started, finished, cancelled, reason } = m.status;
  if (cancelled)                              return 'upcoming'; // treat as not started
  if (!started)                               return 'upcoming';
  if (finished)                               return 'finished';
  const short = (reason?.short ?? '').toUpperCase();
  if (short === 'HT')                         return 'halftime';
  if (short === 'AET' || short === 'ET')      return 'extratime';
  if (short === 'PEN' || short === 'PENS')    return 'penalties';
  return 'live';
}

// ── ESPN response types ───────────────────────────────────────────────────────

interface EspnCompetitor {
  homeAway: 'home' | 'away';
  score:    string;
  team: { displayName: string; abbreviation: string };
}

interface EspnCompetitionStatus {
  clock?:        number;
  displayClock?: string;
  period?:       number;
  type: {
    name:      string;  // e.g. "STATUS_IN_PROGRESS", "STATUS_FINAL"
    state:     string;  // "pre" | "in" | "post"
    completed: boolean;
    detail?:   string;  // "55'" or "Half Time" etc.
  };
}

interface EspnCompetition {
  id:          string;
  date?:       string;   // ISO kickoff time
  competitors: EspnCompetitor[];
  status:      EspnCompetitionStatus;
}

interface EspnEvent {
  id:           string;
  date?:        string;  // ISO kickoff time (top-level)
  competitions: EspnCompetition[];
}

interface EspnScoreboardResponse {
  events?: EspnEvent[];
}

// espnToAppStatus is no longer used for scores (RapidAPI is the score source)
// but kept for reference in case ESPN is needed as a fallback in future.

// ── ESPN goal-scorer helpers ──────────────────────────────────────────────────

interface EspnSummaryResponse {
  keyEvents?: EspnKeyEvent[];
  scoring?:   EspnScoringPlay[];
  boxscore?: {
    teams?: Array<{
      team?: { displayName?: string };
      statistics?: Array<{ name?: string; displayValue?: string }>;
    }>;
  };
}
interface EspnKeyEvent {
  type?:         { text?: string; type?: string };
  text?:         string;
  shortText?:    string;
  homeAway?:     string;
  scoringPlay?:  boolean;
  /** Team that scored — present on scoring key events */
  team?:         { id?: string; displayName?: string };
  /** Primary participant is the goal scorer */
  participants?: Array<{ athlete?: { id?: string; displayName?: string } }>;
  athlete?:      { displayName?: string };
  period?:       { number?: number };
  clock?:        { value?: number; displayValue?: string };
}
interface EspnScoringPlay {
  type?:      { text?: string };
  text?:      string;
  homeAway?:  string;
  participants?: Array<{ athlete?: { displayName?: string } }>;
  period?:    { number?: number };
}

function extractEspnScorers(
  summary: EspnSummaryResponse,
  homeCode: string,
  awayCode: string,
  homeNorm?: string,
  awayNorm?: string,
): GoalScorerEvent[] {
  const map = new Map<string, GoalScorerEvent>();

  const add = (player: string, teamCode: string) => {
    if (!player) return;
    const key = `${player}::${teamCode}`;
    const entry = map.get(key) ?? { player, teamCode, goals: 0 };
    entry.goals++;
    map.set(key, entry);
  };

  // Resolve teamCode from an event's team.displayName (if available),
  // falling back to homeAway string, then defaulting to awayCode.
  const resolveTeamCode = (ev: EspnKeyEvent): string => {
    if (ev.team?.displayName && homeNorm) {
      return normalise(ev.team.displayName) === homeNorm ? homeCode : awayCode;
    }
    if (ev.homeAway === 'home') return homeCode;
    if (ev.homeAway === 'away') return awayCode;
    return awayCode;
  };

  // ESPN keyEvents — scoring plays carry scoringPlay:true and
  // have the scorer in participants[0].athlete.displayName
  for (const ev of summary.keyEvents ?? []) {
    if (!ev.scoringPlay) continue;
    const typeText = (ev.type?.text ?? '').toLowerCase();
    if (!typeText.includes('goal')) continue;
    // Skip own goals and penalty shootout goals
    if (typeText.includes('own') || ev.type?.type?.includes('own')) continue;
    if ((ev.period?.number ?? 0) > 4) continue; // period 5+ = shootout
    // Scorer is first participant; fall back to shortText name or full text
    const name =
      ev.participants?.[0]?.athlete?.displayName ??
      ev.athlete?.displayName ??
      '';
    const teamCode = resolveTeamCode(ev);
    add(name, teamCode);
  }

  // Fallback: summary.scoring array (some ESPN leagues use this instead)
  if (map.size === 0) {
    for (const sp of summary.scoring ?? []) {
      const typeText = (sp.type?.text ?? '').toLowerCase();
      if (!typeText.includes('goal')) continue;
      if (typeText.includes('own') || typeText.includes('penalty')) continue;
      if ((sp.period?.number ?? 0) > 4) continue;
      const name     = sp.participants?.[0]?.athlete?.displayName ?? sp.text ?? '';
      const teamCode = sp.homeAway === 'home' ? homeCode : awayCode;
      add(name, teamCode);
    }
  }

  return Array.from(map.values());
}

function extractMatchEvents(
  summary: EspnSummaryResponse,
  homeNorm: string,
): Array<{ type: string; player: string; teamSide: string; minute: string; minuteSort: number }> {
  const events: Array<{ type: string; player: string; teamSide: string; minute: string; minuteSort: number }> = [];
  for (const ev of summary.keyEvents ?? []) {
    const typeType = ev.type?.type ?? '';
    if (!typeType.includes('goal') && typeType !== 'yellow-card' && typeType !== 'red-card') continue;
    if (typeType.includes('goal') && (ev.period?.number ?? 0) > 4) continue; // no shootout goals
    const minute = ev.clock?.displayValue ?? '';
    const minuteSort = ev.clock?.value ?? 0;
    const teamName = ev.team?.displayName ?? '';
    const teamSide = normalise(teamName) === homeNorm ? 'home' : 'away';
    let eventType: string;
    let player: string;
    if (typeType.includes('goal')) {
      if (typeType.includes('own')) continue; // skip own goals for now
      eventType = 'goal';
      player = ev.participants?.[0]?.athlete?.displayName ?? (ev.shortText ?? '').replace(/ Goal.*$/i, '').trim();
    } else if (typeType === 'yellow-card') {
      eventType = 'yellow-card';
      player = (ev.shortText ?? '').replace(/ Yellow Card$/i, '').trim();
    } else {
      eventType = 'red-card';
      player = (ev.shortText ?? '').replace(/ Red Card$/i, '').trim();
    }
    if (!player) continue;
    events.push({ type: eventType, player, teamSide, minute, minuteSort });
  }
  return events.sort((a, b) => a.minuteSort - b.minuteSort);
}

function extractMatchStats(
  summary: EspnSummaryResponse,
  homeNorm: string,
): Record<string, number> | null {
  const teams = summary.boxscore?.teams ?? [];
  if (teams.length < 2) return null;
  const homeTeam = teams.find((t) => normalise(t.team?.displayName ?? '') === homeNorm);
  const awayTeam = teams.find((t) => normalise(t.team?.displayName ?? '') !== homeNorm);
  if (!homeTeam || !awayTeam) return null;
  const getStat = (teamData: typeof homeTeam, name: string): number => {
    const stat = teamData?.statistics?.find((s) => s.name === name);
    return parseFloat(stat?.displayValue ?? '0') || 0;
  };
  return {
    homePossession: getStat(homeTeam, 'possessionPct'),
    awayPossession: getStat(awayTeam, 'possessionPct'),
    homeShots: getStat(homeTeam, 'totalShots'),
    awayShots: getStat(awayTeam, 'totalShots'),
    homeShotsOnTarget: getStat(homeTeam, 'shotsOnTarget'),
    awayShotsOnTarget: getStat(awayTeam, 'shotsOnTarget'),
    homeCorners: getStat(homeTeam, 'wonCorners'),
    awayCorners: getStat(awayTeam, 'wonCorners'),
    homeFouls: getStat(homeTeam, 'foulsCommitted'),
    awayFouls: getStat(awayTeam, 'foulsCommitted'),
    homeYellows: getStat(homeTeam, 'yellowCards'),
    awayYellows: getStat(awayTeam, 'yellowCards'),
    homeReds: getStat(homeTeam, 'redCards'),
    awayReds: getStat(awayTeam, 'redCards'),
    homeOffsides: getStat(homeTeam, 'offsides'),
    awayOffsides: getStat(awayTeam, 'offsides'),
  };
}

/**
 * Maps common API name variants → our canonical schedule names.
 * Add entries here if the API returns a different spelling.
 */
/**
 * Maps API team name variants → our canonical schedule names.
 *
 * Direction: API name → schedule name.
 * Only add an entry when the API returns a spelling that differs from the schedule.
 * Do NOT add an entry when the API already matches the schedule — that would
 * convert the matching name to something that doesn't match.
 */
const TEAM_NAME_ALIASES: Record<string, string> = {
  // API says → schedule uses
  'Czech Republic':                 'Czechia',
  'Bosnia Herzegovina':             'Bosnia & Herzegovina',
  'Bosnia and Herzegovina':         'Bosnia & Herzegovina',
  // 'United States' is correct in the schedule — no alias needed.
  // Add 'USA' as defensive alias in case the API returns the abbreviation.
  'USA':                            'United States',
  'IR Iran':                        'Iran',
  'Korea Republic':                 'South Korea',
  'Republic of Korea':              'South Korea',
  'Ivory Coast':                    "Côte d'Ivoire",
  "Cote d'Ivoire":                  "Côte d'Ivoire",
  // 'DR Congo' is correct in the schedule — no alias needed.
  // Add 'Congo DR' as defensive alias in case the API returns the reversed form.
  'Congo DR':                       'DR Congo',
  'Democratic Republic of Congo':   'DR Congo',
  'Republic of Congo':              'DR Congo',
  // Türkiye variants
  'Turkey':                         'Türkiye',
};

/** Normalises a team name from the API to our canonical schedule name. */
function normalise(name: string): string {
  return TEAM_NAME_ALIASES[name] ?? name;
}

/**
 * Builds a reverse lookup: "Home|Away" → matchId
 * for group-stage matches where both team names are known upfront.
 */
function buildTeamPairIndex(): Map<string, string> {
  const idx = new Map<string, string>();
  for (const [matchId, entry] of Object.entries(MATCH_SCHEDULE)) {
    if (entry.home && entry.away) {
      idx.set(`${entry.home}|${entry.away}`, matchId);
    }
  }
  return idx;
}

/**
 * Builds a kickoff-time index: "YYYY-MM-DDTHH:MM" → matchId
 * for knockout matches where team names are not known at schedule-build time.
 * The API's status.utcTime is normalised to minute precision for matching.
 */
function buildKickoffIndex(): Map<string, string> {
  const idx = new Map<string, string>();
  for (const [matchId, entry] of Object.entries(MATCH_SCHEDULE)) {
    // Only index knockout slots — identified by empty home/away
    if (!entry.home && !entry.away && entry.kickoffAt) {
      const key = new Date(entry.kickoffAt).toISOString().slice(0, 16);
      idx.set(key, matchId);
    }
  }
  return idx;
}

export interface GoalScorerEvent {
  player:   string;
  teamCode: string;
  goals:    number;
}

/**
 * Polls RapidAPI for today's World Cup scores every 2 min and writes to
 * Firestore. Goal scorers are fetched separately from ESPN (free, no key).
 *
 * The onMatchStatusChange trigger fires notifications whenever status or
 * scores change in Firestore.
 */
export const pollLiveScores = onSchedule(
  {
    schedule:       'every 1 minutes',
    timeoutSeconds: 60,
    memory:         '256MiB',
    secrets:        [RAPIDAPI_KEY],
  },
  async () => {
    // Only run during the tournament window
    const now   = new Date();
    const start = new Date('2026-06-11T00:00:00Z');
    const end   = new Date('2026-07-20T00:00:00Z');
    if (now < start || now > end) {
      console.log('Outside tournament window — skipping poll.');
      return;
    }

    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');

    // RapidAPI uses local venue dates (US timezones). A match at 02:00 UTC on
    // the 12th may be listed under the 11th. Query both today and yesterday.
    const yesterday = new Date(now);
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    const yDateStr = yesterday.toISOString().slice(0, 10).replace(/-/g, '');

    const apiKey = RAPIDAPI_KEY.value();

    const fetchRapidDate = async (ds: string): Promise<RapidMatch[]> => {
      const res = await fetch(`${RAPIDAPI_BY_DATE}?date=${ds}`, {
        headers: {
          'x-rapidapi-key':  apiKey,
          'x-rapidapi-host': RAPIDAPI_HOST,
        },
      });
      if (!res.ok) return [];
      const json = await res.json() as RapidMatchesResponse;
      const all  = json?.response?.matches ?? [];
      // Filter to WC 2026 group stage only
      return all.filter((m) => m.leagueId === WC_2026_LEAGUE_ID);
    };

    let rapidMatches: RapidMatch[] = [];
    try {
      const [todayMatches, ydayMatches] = await Promise.all([
        fetchRapidDate(dateStr),
        fetchRapidDate(yDateStr),
      ]);
      // De-duplicate by match id
      const seen = new Set<number>();
      for (const m of [...todayMatches, ...ydayMatches]) {
        if (!seen.has(m.id)) { seen.add(m.id); rapidMatches.push(m); }
      }
    } catch (err) {
      console.error('RapidAPI fetch failed:', err);
      await db.doc('pollDiagnostics/latest').set({
        checkedAt: admin.firestore.FieldValue.serverTimestamp(),
        source: 'rapidapi', date: dateStr, error: String(err),
      }, { merge: true });
      return;
    }

    // Write diagnostic
    await db.doc('pollDiagnostics/latest').set({
      checkedAt:    admin.firestore.FieldValue.serverTimestamp(),
      source:       'rapidapi',
      date:         dateStr,
      totalMatches: rapidMatches.length,
      sampleMatches: rapidMatches.slice(0, 8).map((m) => ({
        id:     m.id,
        home:   m.home.name,
        away:   m.away.name,
        score:  `${m.home.score}-${m.away.score}`,
        status: m.status.reason?.short ?? (m.status.finished ? 'FT' : m.status.started ? 'Live' : 'Sched'),
      })),
    }, { merge: true });

    if (rapidMatches.length === 0) {
      console.log(`No RapidAPI WC matches for ${dateStr} or ${yDateStr}.`);
      return;
    }

    console.log(`RapidAPI: ${rapidMatches.length} WC matches for ${dateStr}+${yDateStr}.`);

    const teamPairIndex = buildTeamPairIndex();
    const kickoffIndex  = buildKickoffIndex();
    const batch         = db.batch();
    let   updateCount   = 0;

    for (const m of rapidMatches) {
      const homeNorm = normalise(m.home.longName || m.home.name);
      const awayNorm = normalise(m.away.longName || m.away.name);

      // Primary lookup by team-name pair
      let matchId: string | undefined = teamPairIndex.get(`${homeNorm}|${awayNorm}`);

      // Fallback for knockout slots: match by kickoff UTC time
      if (!matchId) {
        const apiKickoff = m.status.utcTime
          ? new Date(m.status.utcTime).toISOString().slice(0, 16)
          : null;
        if (apiKickoff) matchId = kickoffIndex.get(apiKickoff);
        if (matchId) {
          console.log(`  Knockout via kickoff ${apiKickoff} → ${matchId} (${homeNorm} vs ${awayNorm})`);
        }
      }

      if (!matchId) {
        console.warn(`No schedule entry for "${homeNorm} vs ${awayNorm}" — skipping.`);
        continue;
      }

      const appStatus  = rapidToAppStatus(m);
      const homeScore  = m.home.score ?? 0;
      const awayScore  = m.away.score ?? 0;

      batch.set(
        db.collection('matches').doc(matchId),
        {
          homeScore,
          awayScore,
          status:       appStatus,
          lastSyncAt:   admin.firestore.FieldValue.serverTimestamp(),
          rapidMatchId: m.id,
        },
        { merge: true },
      );
      updateCount++;
      console.log(`  ${matchId}: ${homeNorm} ${homeScore}–${awayScore} ${awayNorm} [${appStatus}]`);
    }

    if (updateCount > 0) {
      await batch.commit();
      console.log(`Committed ${updateCount} match updates.`);
    }

    // ── Goal scorers via ESPN summary ─────────────────────────────────────
    // RapidAPI has no scorer endpoint — use free ESPN summary API instead.
    // Fetch ESPN scoreboard to get ESPN event IDs, then fetch each summary.

    const liveOrDoneMatches = rapidMatches.filter(
      (m) => m.status.started && !m.status.cancelled,
    );
    if (liveOrDoneMatches.length === 0) return;

    // Fetch ESPN scoreboard (both dates) to build matchId → espnEventId map
    const fetchEspnDate = async (ds: string): Promise<EspnEvent[]> => {
      const res = await fetch(`${ESPN_WC_SCOREBOARD}?dates=${ds}`);
      if (!res.ok) return [];
      const json = await res.json() as EspnScoreboardResponse;
      return json.events ?? [];
    };

    let espnEvents: EspnEvent[] = [];
    try {
      const [todayEspn, ydayEspn] = await Promise.all([
        fetchEspnDate(dateStr),
        fetchEspnDate(yDateStr),
      ]);
      const seenEspn = new Set<string>();
      for (const ev of [...todayEspn, ...ydayEspn]) {
        if (!seenEspn.has(ev.id)) { seenEspn.add(ev.id); espnEvents.push(ev); }
      }
    } catch {
      console.warn('ESPN scoreboard fetch failed — skipping scorer update.');
      return;
    }

    // Build matchId → ESPN event lookup
    const matchToEspnEvent = new Map<string, EspnEvent>();
    for (const ev of espnEvents) {
      const comp     = ev.competitions?.[0];
      const homeComp = comp?.competitors.find((c) => c.homeAway === 'home');
      const awayComp = comp?.competitors.find((c) => c.homeAway === 'away');
      if (!homeComp || !awayComp) continue;
      const hNorm = normalise(homeComp.team.displayName);
      const aNorm = normalise(awayComp.team.displayName);
      const mid   = teamPairIndex.get(`${hNorm}|${aNorm}`);
      if (mid) matchToEspnEvent.set(mid, ev);
    }

    await Promise.allSettled(liveOrDoneMatches.map(async (m) => {
      const homeNorm = normalise(m.home.longName || m.home.name);
      const awayNorm = normalise(m.away.longName || m.away.name);
      let   matchId  = teamPairIndex.get(`${homeNorm}|${awayNorm}`);
      if (!matchId) {
        const apiKickoff = m.status.utcTime
          ? new Date(m.status.utcTime).toISOString().slice(0, 16)
          : null;
        if (apiKickoff) matchId = kickoffIndex.get(apiKickoff);
      }
      if (!matchId) return;

      const espnEvent = matchToEspnEvent.get(matchId);
      if (!espnEvent) return;

      const homeCode = TEAM_NAME_TO_CODE[homeNorm] ?? homeNorm.slice(0, 3).toUpperCase();
      const awayCode = TEAM_NAME_TO_CODE[awayNorm] ?? awayNorm.slice(0, 3).toUpperCase();

      // Use ESPN's own home team name for within-summary lookups so the
      // name matches exactly what ESPN's boxscore and keyEvents contain,
      // regardless of whatever name RapidAPI returned for the same team.
      const espnHomeComp = espnEvent.competitions?.[0]?.competitors.find(
        (c) => c.homeAway === 'home',
      );
      const espnHomeNorm = normalise(espnHomeComp?.team?.displayName ?? '') || homeNorm;

      try {
        const summaryRes = await fetch(`${ESPN_WC_SUMMARY}?event=${espnEvent.id}`);
        if (!summaryRes.ok) return;
        const summary = await summaryRes.json() as EspnSummaryResponse;
        const scorers = extractEspnScorers(summary, homeCode, awayCode, homeNorm, awayNorm);

        // Repeat name once per goal — calcPoints awards 2pts × goals for multi-goal scorers
        const homeScorers = scorers
          .filter((s) => s.teamCode === homeCode)
          .flatMap((s) => Array<string>(s.goals).fill(s.player));
        const awayScorers = scorers
          .filter((s) => s.teamCode === awayCode)
          .flatMap((s) => Array<string>(s.goals).fill(s.player));

        // Use espnHomeNorm (from ESPN's own data) so extractMatchEvents /
        // extractMatchStats can find the home team in the boxscore without
        // relying on RapidAPI's potentially different spelling.
        const matchEvents = extractMatchEvents(summary, espnHomeNorm);
        const matchStats  = extractMatchStats(summary, espnHomeNorm);

        await db.collection('matches').doc(matchId).set(
          {
            goalScorerEvents: scorers,
            homeScorers,
            awayScorers,
            matchEvents,
            ...(matchStats ? { matchStats } : {}),
          },
          { merge: true },
        );

        if (scorers.length > 0) {
          console.log(
            `  Goal scorers ${matchId}: ` +
            scorers.map((s) => `${s.player}(${s.teamCode})×${s.goals}`).join(', '),
          );
        }
      } catch (err) {
        console.warn(`ESPN summary failed for ${matchId} (espnId=${espnEvent.id}):`, err);
      }
    }));
  }
);

