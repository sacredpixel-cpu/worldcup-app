"use strict";
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
exports.onMatchStatusChange = void 0;
const admin = __importStar(require("firebase-admin"));
const firestore_1 = require("firebase-functions/v2/firestore");
admin.initializeApp();
const db = admin.firestore();
const fcm = admin.messaging();
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
 * Sends a multicast FCM message, batching tokens into groups of 500
 * (the FCM per-call limit).
 */
async function broadcast(message) {
    const tokens = await getAllTokens();
    if (tokens.length === 0)
        return;
    // Batch into chunks of 500
    for (let i = 0; i < tokens.length; i += 500) {
        const chunk = tokens.slice(i, i + 500);
        const response = await fcm.sendEachForMulticast(Object.assign(Object.assign({}, message), { tokens: chunk }));
        // Clean up any tokens that have become stale / unregistered
        const staleDeletions = [];
        response.responses.forEach((resp, idx) => {
            var _a;
            if (!resp.success && ((_a = resp.error) === null || _a === void 0 ? void 0 : _a.code) === 'messaging/registration-token-not-registered') {
                const staleToken = chunk[idx];
                staleDeletions.push(db.collection('fcmTokens').doc(staleToken).delete());
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
exports.onMatchStatusChange = (0, firestore_1.onDocumentUpdated)('matches/{matchId}', async (event) => {
    var _a, _b, _c, _d;
    const before = (_a = event.data) === null || _a === void 0 ? void 0 : _a.before.data();
    const after = (_b = event.data) === null || _b === void 0 ? void 0 : _b.after.data();
    if (!before || !after)
        return;
    const prevStatus = before.status;
    const newStatus = after.status;
    // Only act on actual status changes
    if (prevStatus === newStatus)
        return;
    const matchId = event.params.matchId;
    // ── Match kicked off ──────────────────────────────────────────────────
    if (newStatus === 'live') {
        await broadcast({
            notification: {
                title: '⚽ Match Starting Now!',
                body: 'A World Cup 2026 match has just kicked off. Lock in your prediction!',
            },
            data: {
                matchId,
                url: '/schedule',
                type: 'kickoff',
            },
            webpush: {
                notification: {
                    icon: 'https://worldcup-2026-43ab4.web.app/mexillicious-logo.png',
                    badge: 'https://worldcup-2026-43ab4.web.app/mexillicious-logo.png',
                    tag: `kickoff-${matchId}`,
                    requireInteraction: false,
                },
                fcmOptions: {
                    link: 'https://worldcup-2026-43ab4.web.app/schedule',
                },
            },
            android: {
                notification: {
                    icon: 'ic_notification',
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
        const homeScore = (_c = after.homeScore) !== null && _c !== void 0 ? _c : '?';
        const awayScore = (_d = after.awayScore) !== null && _d !== void 0 ? _d : '?';
        await broadcast({
            notification: {
                title: `🏁 Match Over! ${homeScore}–${awayScore}`,
                body: 'The final whistle has blown. Check how your prediction scored!',
            },
            data: {
                matchId,
                url: '/predictions',
                type: 'fulltime',
            },
            webpush: {
                notification: {
                    icon: 'https://worldcup-2026-43ab4.web.app/mexillicious-logo.png',
                    badge: 'https://worldcup-2026-43ab4.web.app/mexillicious-logo.png',
                    tag: `fulltime-${matchId}`,
                    requireInteraction: false,
                },
                fcmOptions: {
                    link: 'https://worldcup-2026-43ab4.web.app/predictions',
                },
            },
            android: {
                notification: {
                    icon: 'ic_notification',
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
});
//# sourceMappingURL=index.js.map