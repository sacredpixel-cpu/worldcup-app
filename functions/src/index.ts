/**
 * World Cup 2026 — Firebase Cloud Functions
 *
 * Three push notification triggers:
 *
 *  1. notify24hrReminder  — Scheduled every 30 min. Finds any match whose
 *                           kickoff is 24 hours away and sends a reminder
 *                           to set predictions before they lock.
 *                           De-duped via Firestore so it fires exactly once
 *                           per match.
 *
 *  2. notifyKickoff       — Firestore trigger on matches/{matchId}.
 *                           Fires when status changes → "live".
 *                           Tells users predictions are now locked and the
 *                           match has started. Links to /predictions.
 *
 *  3. notifyFullTime      — Same trigger, fires when status → "finished".
 *                           Includes the final score. Links to /predictions
 *                           so users can check how they scored.
 *
 * Deploy:
 *   cd functions && npm install && npm run build
 *   firebase deploy --only functions
 */

import * as admin from 'firebase-admin';
import { onSchedule }         from 'firebase-functions/v2/scheduler';
import { onDocumentUpdated }  from 'firebase-functions/v2/firestore';
import type { MulticastMessage } from 'firebase-admin/messaging';
import { MATCH_SCHEDULE }     from './schedule';

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

// ─── 2 & 3. Kickoff + Full-Time ──────────────────────────────────────────────

/**
 * Fires whenever a document in matches/{matchId} is updated.
 *   status → "live"     → predictions locked notification
 *   status → "finished" → final score notification
 */
export const onMatchStatusChange = onDocumentUpdated(
  'matches/{matchId}',
  async (event) => {
    const before = event.data?.before.data();
    const after  = event.data?.after.data();
    if (!before || !after) return;

    const prevStatus = before.status as string | undefined;
    const newStatus  = after.status  as string | undefined;
    if (prevStatus === newStatus) return;

    const matchId = event.params.matchId;
    const entry   = MATCH_SCHEDULE[matchId];
    const teamsKnown = entry?.home && entry?.away;

    // ── 2. Match kicked off — predictions are now locked ──────────────────
    if (newStatus === 'live') {
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
    if (newStatus === 'finished') {
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
  }
);
