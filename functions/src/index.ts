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

// Firebase Secret — set with: firebase functions:secrets:set RAPIDAPI_KEY
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
 * WC 2026 league ID in the "Free API Live Football Data" (RapidAPI / FotMob).
 * Confirmed by querying /football-get-matches-by-date for June 11 2026.
 */
const WC_LEAGUE_ID = 914609;
const RAPIDAPI_HOST = 'free-api-live-football-data.p.rapidapi.com';

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

interface ApiMatch {
  id: number;
  leagueId: number;
  home: { name: string; score: number; penScore?: number };
  away: { name: string; score: number; penScore?: number };
  statusId: number;
  status: {
    started: boolean;
    finished: boolean;
    utcTime: string;
    reason?: { short: string };
  };
}

/**
 * Maps FotMob statusId to our Firestore status string.
 *  1  = Not started
 *  2  = First half
 *  3  = Half time
 *  4  = Second half
 *  5  = Full time (regular)
 *  6  = Extra time
 *  7  = Extra time (second half)
 *  8  = Penalty shootout
 * 13  = Full time after extra/pens
 */
function toAppStatus(m: ApiMatch): string {
  if (!m.status.started)  return 'upcoming';
  if (m.status.finished)  return 'finished';
  const sid = m.statusId;
  if (sid === 3)          return 'halftime';
  if (sid === 6 || sid === 7) return 'extratime';
  if (sid === 8)          return 'penalties';
  return 'live';
}

// ─── Match-details types + goal scorer extraction ────────────────────────────

interface ShotEvent {
  playerName?:  string;
  firstName?:   string;
  lastName?:    string;
  teamId?:      number;
  eventType?:   string;   // "Goal" | "AttemptSaved" | "Block" | "Miss" | ...
  isOwnGoal?:   boolean;
  period?:      string;   // "FirstHalf" | "SecondHalf" | "ExtraTimeFirstHalf" | "Penalties" | ...
}

interface MatchEventEntry {
  type?:       string | { id?: string };
  player?:     { name?: string; id?: number };
  teamId?:     number;
  isHome?:     boolean;
  isOwnGoal?:  boolean;
  period?:     string | number;
}

interface MatchDetailsResponse {
  header?: {
    teams?: Array<{ id?: number; name?: string }>;
  };
  content?: {
    shotmap?: { shots?: ShotEvent[] };
    matchFacts?: {
      events?: {
        events?: MatchEventEntry[];
      };
    };
  };
}

export interface GoalScorerEvent {
  player:   string;
  teamCode: string;
  goals:    number;
}

/**
 * Extracts goal scorers from a FotMob match-details response.
 * Excludes own goals and penalty-shootout goals (per Golden Boot rules).
 *
 * Tries two data sources in order:
 *   1. content.shotmap.shots  — most reliable (per-shot granularity)
 *   2. content.matchFacts.events.events — fallback event list
 */
function extractGoalScorers(
  details: MatchDetailsResponse,
  homeCode: string,
  awayCode: string,
): GoalScorerEvent[] {
  const homeTeamId = details.header?.teams?.[0]?.id;
  const awayTeamId = details.header?.teams?.[1]?.id;

  const map = new Map<string, GoalScorerEvent>();

  const add = (playerName: string, teamCode: string) => {
    if (!playerName) return;
    const key = `${playerName}::${teamCode}`;
    const entry = map.get(key) ?? { player: playerName, teamCode, goals: 0 };
    entry.goals++;
    map.set(key, entry);
  };

  const resolveTeam = (teamId: number | undefined, isHome?: boolean): string => {
    if (isHome !== undefined) return isHome ? homeCode : awayCode;
    if (homeTeamId && teamId === homeTeamId) return homeCode;
    if (awayTeamId && teamId === awayTeamId) return awayCode;
    return homeCode; // fallback
  };

  // Method 1: shotmap
  const shots = details.content?.shotmap?.shots ?? [];
  for (const s of shots) {
    if (s.eventType !== 'Goal') continue;
    if (s.isOwnGoal) continue;
    if (String(s.period ?? '').toLowerCase().includes('penalt')) continue;

    const name = s.playerName || `${s.firstName ?? ''} ${s.lastName ?? ''}`.trim();
    add(name, resolveTeam(s.teamId));
  }

  // Method 2: matchFacts events (fallback if shotmap empty)
  if (map.size === 0) {
    const events = details.content?.matchFacts?.events?.events ?? [];
    for (const ev of events) {
      const typeId = typeof ev.type === 'string' ? ev.type : ev.type?.id ?? '';
      if (typeId !== 'Goal' && typeId !== 'PenGoal') continue;
      if (ev.isOwnGoal) continue;
      if (String(ev.period ?? '').toLowerCase().includes('penalt')) continue;

      const name = ev.player?.name ?? '';
      add(name, resolveTeam(ev.teamId, ev.isHome));
    }
  }

  return Array.from(map.values());
}

/**
 * Polls the RapidAPI live football data for today's World Cup matches
 * and writes updated scores + status to Firestore.
 *
 * Runs every 2 minutes. Only active during the tournament window
 * (Jun 11 – Jul 19 2026) to avoid burning API quota.
 *
 * The onMatchStatusChange trigger above then fires notifications
 * automatically whenever status or scores change in Firestore.
 */
export const pollLiveScores = onSchedule(
  {
    schedule: 'every 2 minutes',
    secrets: [RAPIDAPI_KEY],
    timeoutSeconds: 60,
    memory: '256MiB',
  },
  async () => {
    // Only run during the tournament window
    const now = new Date();
    const start = new Date('2026-06-11T00:00:00Z');
    const end   = new Date('2026-07-20T00:00:00Z');
    if (now < start || now > end) {
      console.log('Outside tournament window — skipping poll.');
      return;
    }

    // .trim() strips any accidental trailing newline from the secret value
    const key = RAPIDAPI_KEY.value().trim();
    if (!key) {
      console.error('RAPIDAPI_KEY secret not set.');
      return;
    }

    // Fetch today's matches from the API (YYYYMMDD format)
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const url = `https://${RAPIDAPI_HOST}/football-get-matches-by-date?date=${dateStr}`;

    let apiMatches: ApiMatch[] = [];
    try {
      const res = await fetch(url, {
        headers: {
          'x-rapidapi-host': RAPIDAPI_HOST,
          'x-rapidapi-key':  key,
        },
      });
      const json = await res.json() as { status: string; response?: { matches?: ApiMatch[] } };
      if (json.status !== 'success') {
        console.error('API returned non-success:', JSON.stringify(json));
        return;
      }
      apiMatches = (json.response?.matches ?? []).filter(
        (m) => m.leagueId === WC_LEAGUE_ID
      );
    } catch (err) {
      console.error('Failed to fetch live scores:', err);
      return;
    }

    if (apiMatches.length === 0) {
      console.log(`No WC matches found for date ${dateStr}.`);
      return;
    }

    console.log(`Found ${apiMatches.length} WC matches for ${dateStr}.`);

    const teamPairIndex = buildTeamPairIndex();
    const kickoffIndex  = buildKickoffIndex(); // fallback for knockout matches (TBD teams)
    const batch = db.batch();
    let updateCount = 0;

    for (const m of apiMatches) {
      const homeNorm = normalise(m.home.name);
      const awayNorm = normalise(m.away.name);

      // Primary lookup: team-name pair (works for all group-stage matches)
      let matchId: string | undefined = teamPairIndex.get(`${homeNorm}|${awayNorm}`);

      // Fallback for knockout matches whose slots have blank home/away in the schedule:
      // match by kickoff time (each knockout slot has a unique UTC kickoff minute).
      if (!matchId) {
        const apiKickoff = m.status.utcTime
          ? new Date(m.status.utcTime).toISOString().slice(0, 16)
          : null;
        if (apiKickoff) matchId = kickoffIndex.get(apiKickoff);
        if (matchId) {
          console.log(`  Knockout slot via kickoff ${apiKickoff} → ${matchId} (${homeNorm} vs ${awayNorm})`);
        }
      }

      if (!matchId) {
        console.warn(`No schedule entry for "${homeNorm} vs ${awayNorm}" — skipping.`);
        continue;
      }

      const appStatus = toAppStatus(m);
      const docRef    = db.collection('matches').doc(matchId);

      const update: Record<string, unknown> = {
        homeScore:  m.home.score,
        awayScore:  m.away.score,
        status:     appStatus,
        lastSyncAt: admin.firestore.FieldValue.serverTimestamp(),
        apiMatchId: m.id,
      };

      // Include penalty scores when present
      if (m.home.penScore !== undefined) update.homePenScore = m.home.penScore;
      if (m.away.penScore !== undefined) update.awayPenScore = m.away.penScore;

      batch.set(docRef, update, { merge: true });
      updateCount++;
      console.log(
        `  ${matchId}: ${homeNorm} ${m.home.score}–${m.away.score} ${awayNorm} [${appStatus}]`
      );
    }

    if (updateCount > 0) {
      await batch.commit();
      console.log(`Committed ${updateCount} match updates.`);
    }

    // ── Fetch match details to extract goal scorers ───────────────────────
    // For every live or finished match that has an API match ID, call
    // football-get-match-details and write goalScorerEvents to the match doc.
    // Runs concurrently (Promise.allSettled) so one failure doesn't block others.

    const liveOrDone = apiMatches.filter(m => {
      const s = toAppStatus(m);
      return s === 'live' || s === 'halftime' || s === 'extratime' ||
             s === 'penalties' || s === 'finished';
    });

    if (liveOrDone.length === 0) return;

    let detailsLogged = false; // log raw response once per poll for debugging

    await Promise.allSettled(liveOrDone.map(async (m) => {
      const homeNorm = normalise(m.home.name);
      const awayNorm = normalise(m.away.name);

      let matchId: string | undefined = teamPairIndex.get(`${homeNorm}|${awayNorm}`);
      if (!matchId) {
        // Same kickoff-time fallback as the score-update loop above
        const apiKickoff = m.status.utcTime
          ? new Date(m.status.utcTime).toISOString().slice(0, 16)
          : null;
        if (apiKickoff) matchId = kickoffIndex.get(apiKickoff);
      }
      if (!matchId) return;

      const homeCode = TEAM_NAME_TO_CODE[homeNorm] ?? homeNorm.slice(0, 3).toUpperCase();
      const awayCode = TEAM_NAME_TO_CODE[awayNorm] ?? awayNorm.slice(0, 3).toUpperCase();

      const detailUrl =
        `https://${RAPIDAPI_HOST}/football-get-match-details?match_id=${m.id}`;

      let detailsJson: unknown;
      try {
        const res = await fetch(detailUrl, {
          headers: {
            'x-rapidapi-host': RAPIDAPI_HOST,
            'x-rapidapi-key':  key,
          },
        });
        if (!res.ok) {
          console.warn(`match-details HTTP ${res.status} for ${matchId} (apiId=${m.id})`);
          return;
        }
        detailsJson = await res.json();
      } catch (err) {
        console.error(`match-details fetch failed for ${matchId}:`, err);
        return;
      }

      // Log the raw structure once per poll run so we can verify field paths
      if (!detailsLogged) {
        detailsLogged = true;
        console.log(
          `match-details sample (${matchId}):`,
          JSON.stringify(detailsJson).slice(0, 1500),
        );
      }

      // Unwrap response envelope if present
      const envelope = detailsJson as { status?: string; response?: MatchDetailsResponse };
      const details: MatchDetailsResponse =
        envelope.response ?? (detailsJson as MatchDetailsResponse);

      const scorers = extractGoalScorers(details, homeCode, awayCode);

      // Always write (even if empty) so UI knows we've checked
      await db.collection('matches').doc(matchId).set(
        { goalScorerEvents: scorers },
        { merge: true },
      );

      if (scorers.length > 0) {
        console.log(
          `  Goal scorers ${matchId}: ` +
          scorers.map(s => `${s.player}(${s.teamCode})×${s.goals}`).join(', '),
        );
      }
    }));
  }
);
