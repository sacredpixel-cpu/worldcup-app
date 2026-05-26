/**
 * World Cup 2026 — Firebase Cloud Functions
 *
 * Two functions:
 *  1. notifyMatchKickoff  — fires when a match status changes to "live"
 *  2. notifyMatchFinished — fires when a match status changes to "finished"
 *
 * Both read all FCM tokens from the `fcmTokens` collection and broadcast
 * via Firebase Cloud Messaging.
 *
 * Deploy:
 *   cd functions && npm install && npm run build
 *   firebase deploy --only functions
 *
 * First-time setup:
 *   npm install -g firebase-tools
 *   firebase login
 *   firebase use worldcup-2026-43ab4
 */

import * as admin from 'firebase-admin';
import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { MulticastMessage } from 'firebase-admin/messaging';

admin.initializeApp();

const db   = admin.firestore();
const fcm  = admin.messaging();

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
 * Sends a multicast FCM message, batching tokens into groups of 500
 * (the FCM per-call limit).
 */
async function broadcast(message: Omit<MulticastMessage, 'tokens'>): Promise<void> {
  const tokens = await getAllTokens();
  if (tokens.length === 0) return;

  // Batch into chunks of 500
  for (let i = 0; i < tokens.length; i += 500) {
    const chunk = tokens.slice(i, i + 500);
    const response = await fcm.sendEachForMulticast({ ...message, tokens: chunk });

    // Clean up any tokens that have become stale / unregistered
    const staleDeletions: Promise<unknown>[] = [];
    response.responses.forEach((resp, idx) => {
      if (!resp.success && resp.error?.code === 'messaging/registration-token-not-registered') {
        const staleToken = chunk[idx];
        staleDeletions.push(
          db.collection('fcmTokens').doc(staleToken).delete()
        );
      }
    });
    await Promise.all(staleDeletions);
  }
}

// ─── Cloud Functions ──────────────────────────────────────────────────────────

/**
 * Fires whenever a document in `matches/{matchId}` is written.
 * Detects status transitions and sends the appropriate notification.
 */
export const onMatchStatusChange = onDocumentUpdated(
  'matches/{matchId}',
  async (event) => {
    const before = event.data?.before.data();
    const after  = event.data?.after.data();

    if (!before || !after) return;

    const prevStatus = before.status as string | undefined;
    const newStatus  = after.status  as string | undefined;

    // Only act on actual status changes
    if (prevStatus === newStatus) return;

    const matchId = event.params.matchId;

    // ── Match kicked off ──────────────────────────────────────────────────
    if (newStatus === 'live') {
      await broadcast({
        notification: {
          title: '⚽ Match Starting Now!',
          body:  'A World Cup 2026 match has just kicked off. Lock in your prediction!',
        },
        data: {
          matchId,
          url:  '/schedule',
          type: 'kickoff',
        },
        webpush: {
          notification: {
            icon:  'https://worldcup-2026-43ab4.web.app/mexillicious-logo.png',
            badge: 'https://worldcup-2026-43ab4.web.app/mexillicious-logo.png',
            tag:   `kickoff-${matchId}`,
            requireInteraction: false,
          },
          fcmOptions: {
            link: 'https://worldcup-2026-43ab4.web.app/schedule',
          },
        },
        android: {
          notification: {
            icon:     'ic_notification',
            priority: 'high',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
        },
      });

      console.log(`[kickoff] Notifications sent for match ${matchId}`);
    }

    // ── Match finished ────────────────────────────────────────────────────
    if (newStatus === 'finished') {
      const homeScore = after.homeScore ?? '?';
      const awayScore = after.awayScore ?? '?';

      await broadcast({
        notification: {
          title: `🏁 Match Over! ${homeScore}–${awayScore}`,
          body:  'The final whistle has blown. Check how your prediction scored!',
        },
        data: {
          matchId,
          url:  '/predictions',
          type: 'fulltime',
        },
        webpush: {
          notification: {
            icon:  'https://worldcup-2026-43ab4.web.app/mexillicious-logo.png',
            badge: 'https://worldcup-2026-43ab4.web.app/mexillicious-logo.png',
            tag:   `fulltime-${matchId}`,
            requireInteraction: false,
          },
          fcmOptions: {
            link: 'https://worldcup-2026-43ab4.web.app/predictions',
          },
        },
        android: {
          notification: {
            icon:     'ic_notification',
            priority: 'default',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
        },
      });

      console.log(`[fulltime] Notifications sent for match ${matchId} (${homeScore}–${awayScore})`);
    }
  }
);
