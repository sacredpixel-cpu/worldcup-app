"use strict";
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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.onMatchStatusChange = exports.notify24hrReminder = void 0;
const admin = __importStar(require("firebase-admin"));
const scheduler_1 = require("firebase-functions/v2/scheduler");
const firestore_1 = require("firebase-functions/v2/firestore");
const schedule_1 = require("./schedule");
admin.initializeApp();
const db = admin.firestore();
const fcm = admin.messaging();
// Base URL of the deployed web app
const APP_URL = 'https://worldcup-2026-43ab4.web.app';
const ICON = `${APP_URL}/mexillicious-logo.png`;
// ─── Helpers ─────────────────────────────────────────────────────────────────
/** Fetches all enabled FCM tokens from Firestore. */
async function getAllTokens() {
    const snap = await db
        .collection('fcmTokens')
        .where('enabled', '==', true)
        .get();
    return snap.docs.map((d) => d.data().token).filter(Boolean);
}
/**
 * Sends a multicast FCM message batched in groups of ≤500 (FCM limit).
 * Automatically removes stale/unregistered tokens from Firestore.
 */
async function broadcast(message) {
    const tokens = await getAllTokens();
    if (tokens.length === 0) {
        console.log('No opted-in tokens — skipping broadcast.');
        return;
    }
    for (let i = 0; i < tokens.length; i += 500) {
        const chunk = tokens.slice(i, i + 500);
        const response = await fcm.sendEachForMulticast(Object.assign(Object.assign({}, message), { tokens: chunk }));
        // Clean up tokens FCM says are no longer valid
        const stale = [];
        response.responses.forEach((resp, idx) => {
            var _a;
            if (!resp.success &&
                ((_a = resp.error) === null || _a === void 0 ? void 0 : _a.code) === 'messaging/registration-token-not-registered') {
                stale.push(db.collection('fcmTokens').doc(chunk[idx]).delete());
            }
        });
        await Promise.all(stale);
        console.log(`Batch ${i / 500 + 1}: ${response.successCount} sent, ` +
            `${response.failureCount} failed, ${stale.length} tokens cleaned.`);
    }
}
/** Builds consistent webpush + apns options for every notification. */
function webpushOptions(url, tag) {
    return {
        webpush: {
            notification: { icon: ICON, badge: ICON, tag, requireInteraction: false },
            fcmOptions: { link: `${APP_URL}${url}` },
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
exports.notify24hrReminder = (0, scheduler_1.onSchedule)('every 30 minutes', async () => {
    const now = Date.now();
    const windowStart = now + 23 * 60 * 60 * 1000; // now + 23 h
    const windowEnd = now + 24 * 60 * 60 * 1000; // now + 24 h
    const matchesToNotify = Object.entries(schedule_1.MATCH_SCHEDULE).filter(([, entry]) => {
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
        await broadcast(Object.assign(Object.assign({ notification: { title, body }, data: { matchId, url: '/schedule', type: '24hr' } }, webpushOptions('/schedule', `reminder-24hr-${matchId}`)), { android: {
                notification: { icon: 'ic_notification', priority: 'high' },
            } }));
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
exports.onMatchStatusChange = (0, firestore_1.onDocumentUpdated)('matches/{matchId}', async (event) => {
    var _a, _b, _c, _d;
    const before = (_a = event.data) === null || _a === void 0 ? void 0 : _a.before.data();
    const after = (_b = event.data) === null || _b === void 0 ? void 0 : _b.after.data();
    if (!before || !after)
        return;
    const prevStatus = before.status;
    const newStatus = after.status;
    if (prevStatus === newStatus)
        return;
    const matchId = event.params.matchId;
    const entry = schedule_1.MATCH_SCHEDULE[matchId];
    const teamsKnown = (entry === null || entry === void 0 ? void 0 : entry.home) && (entry === null || entry === void 0 ? void 0 : entry.away);
    // ── 2. Match kicked off — predictions are now locked ──────────────────
    if (newStatus === 'live') {
        const title = teamsKnown
            ? `🔒 ${entry.home} vs ${entry.away} — Predictions Locked`
            : '🔒 Match Started — Predictions Locked';
        const body = teamsKnown
            ? `${entry.home} vs ${entry.away} has kicked off. Predictions are locked — check yours now!`
            : 'The match has kicked off. Predictions are locked — check yours now!';
        await broadcast(Object.assign(Object.assign({ notification: { title, body }, data: { matchId, url: '/predictions', type: 'kickoff' } }, webpushOptions('/predictions', `kickoff-${matchId}`)), { android: {
                notification: { icon: 'ic_notification', priority: 'default' },
            } }));
        console.log(`Kickoff notification sent for ${matchId}.`);
    }
    // ── 3. Match finished — show final score ──────────────────────────────
    if (newStatus === 'finished') {
        const homeScore = (_c = after.homeScore) !== null && _c !== void 0 ? _c : '?';
        const awayScore = (_d = after.awayScore) !== null && _d !== void 0 ? _d : '?';
        const scoreStr = `${homeScore}–${awayScore}`;
        const title = teamsKnown
            ? `🏁 Full Time: ${entry.home} ${scoreStr} ${entry.away}`
            : `🏁 Full Time: ${scoreStr}`;
        const body = teamsKnown
            ? `${entry.home} ${scoreStr} ${entry.away} — see how your prediction scored!`
            : `Final score ${scoreStr} — see how your prediction scored!`;
        await broadcast(Object.assign(Object.assign({ notification: { title, body }, data: { matchId, url: '/predictions', type: 'fulltime' } }, webpushOptions('/predictions', `fulltime-${matchId}`)), { android: {
                notification: { icon: 'ic_notification', priority: 'default' },
            } }));
        console.log(`Full-time notification sent for ${matchId} (${scoreStr}).`);
    }
});
//# sourceMappingURL=index.js.map