"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pollLiveScores = exports.morningResultsDigest = exports.onMatchStatusChange = exports.notify24hrReminder = void 0;
const admin = __importStar(require("firebase-admin"));
const scheduler_1 = require("firebase-functions/v2/scheduler");
const firestore_1 = require("firebase-functions/v2/firestore");
const node_fetch_1 = __importDefault(require("node-fetch"));
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
// ─── 2, 3 & 4. Kickoff + Full-Time + Upset Alert ─────────────────────────────
/** FIFA codes of traditional powerhouse nations used for upset detection. */
const POWERHOUSES = new Set(['BRA', 'FRA', 'ARG', 'ENG', 'ESP', 'DEU', 'PRT', 'NLD', 'BEL']);
/** Maps all WC 2026 schedule team names → 3-letter FIFA codes. */
const TEAM_NAME_TO_CODE = {
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
function isPowerhouse(teamName) {
    const code = TEAM_NAME_TO_CODE[teamName];
    return code !== undefined && POWERHOUSES.has(code);
}
/**
 * Fires whenever a document in matches/{matchId} is updated.
 *   status → "live"     → predictions locked + upset-live alert
 *   status → "finished" → final score + upset-win alert
 */
exports.onMatchStatusChange = (0, firestore_1.onDocumentUpdated)('matches/{matchId}', async (event) => {
    var _a, _b, _c, _d, _e, _f, _g;
    const before = (_a = event.data) === null || _a === void 0 ? void 0 : _a.before.data();
    const after = (_b = event.data) === null || _b === void 0 ? void 0 : _b.after.data();
    if (!before || !after)
        return;
    const prevStatus = before.status;
    const newStatus = after.status;
    const statusChanged = prevStatus !== newStatus;
    const matchId = event.params.matchId;
    const entry = schedule_1.MATCH_SCHEDULE[matchId];
    const teamsKnown = (entry === null || entry === void 0 ? void 0 : entry.home) && (entry === null || entry === void 0 ? void 0 : entry.away);
    // ── 2. Match kicked off — predictions are now locked ──────────────────
    if (statusChanged && newStatus === 'live') {
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
    if (statusChanged && newStatus === 'finished') {
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
    // ── 4. Goal scored — live score update with scorer name ───────────────
    // Fires on score changes while the match is active (status stays 'live',
    // 'halftime', 'extratime', or 'penalties').  A per-scoreline sentinel doc
    // prevents duplicate notifications if the trigger fires more than once.
    const isActive = newStatus === 'live' || newStatus === 'halftime' ||
        newStatus === 'extratime' || newStatus === 'penalties';
    if (isActive && teamsKnown) {
        const prevHome = typeof before.homeScore === 'number' ? before.homeScore : -1;
        const prevAway = typeof before.awayScore === 'number' ? before.awayScore : -1;
        const newHome = typeof after.homeScore === 'number' ? after.homeScore : -1;
        const newAway = typeof after.awayScore === 'number' ? after.awayScore : -1;
        if ((newHome > prevHome || newAway > prevAway) && newHome >= 0 && newAway >= 0) {
            const scoreStr = `${newHome}–${newAway}`;
            const goalSentinel = db.doc(`notificationsSent/${matchId}_goal_${newHome}_${newAway}`);
            if (!(await goalSentinel.get()).exists) {
                // Determine which team scored
                const scoringTeam = newHome > prevHome ? entry.home : entry.away;
                const beforeEvts = ((_e = before.goalScorerEvents) !== null && _e !== void 0 ? _e : []);
                const afterEvts = ((_f = after.goalScorerEvents) !== null && _f !== void 0 ? _f : []);
                const beforeMap = new Map(beforeEvts.map(e => [`${e.player}::${e.teamCode}`, e.goals]));
                let newScorer = null;
                for (const ev of afterEvts) {
                    const prevGoals = (_g = beforeMap.get(`${ev.player}::${ev.teamCode}`)) !== null && _g !== void 0 ? _g : 0;
                    if (ev.goals > prevGoals) {
                        newScorer = ev.player;
                        break;
                    }
                }
                const title = `⚽ GOAL! ${entry.home} ${scoreStr} ${entry.away}`;
                const body = newScorer
                    ? `${newScorer} scores for ${scoringTeam}!`
                    : `${scoringTeam} score! ${scoreStr}`;
                await broadcast(Object.assign(Object.assign({ notification: { title, body }, data: { matchId, url: '/scores', type: 'goal' } }, webpushOptions('/scores', `goal-${matchId}-${newHome}-${newAway}`)), { android: { notification: { icon: 'ic_notification', priority: 'high' } } }));
                await goalSentinel.set({ sentAt: admin.firestore.FieldValue.serverTimestamp() });
                console.log(`Goal notification: ${title} — ${body}`);
            }
        }
    }
    // ── 5. Upset alert ────────────────────────────────────────────────────
    if (teamsKnown) {
        const home = entry.home;
        const away = entry.away;
        const homeScore = typeof after.homeScore === 'number' ? after.homeScore : null;
        const awayScore = typeof after.awayScore === 'number' ? after.awayScore : null;
        const homePower = isPowerhouse(home);
        const awayPower = isPowerhouse(away);
        // Only fire when exactly one side is a powerhouse and scores are available
        if (homePower !== awayPower && homeScore !== null && awayScore !== null) {
            const powerhouse = homePower ? home : away;
            const underdog = homePower ? away : home;
            const scoreStr = `${homeScore}–${awayScore}`;
            // Underdog is ahead (home is underdog → homeScore > awayScore, or vice versa)
            const underdogAhead = (homePower && awayScore > homeScore) ||
                (awayPower && homeScore > awayScore);
            if (isActive && underdogAhead) {
                const sentRef = db.doc(`notificationsSent/${matchId}_upset_live`);
                if (!(await sentRef.get()).exists) {
                    await broadcast(Object.assign(Object.assign({ notification: {
                            title: '🚨 Upset Alert!',
                            body: `${underdog} is leading ${powerhouse} ${scoreStr} (Live)`,
                        }, data: { matchId, url: '/schedule', type: 'upset_live' } }, webpushOptions('/schedule', `upset-live-${matchId}`)), { android: { notification: { icon: 'ic_notification', priority: 'high' } } }));
                    await sentRef.set({ sentAt: admin.firestore.FieldValue.serverTimestamp(), matchId });
                    console.log(`Upset-live alert: ${underdog} leads ${powerhouse} in ${matchId}.`);
                }
            }
            if (statusChanged && newStatus === 'finished' && underdogAhead) {
                const sentRef = db.doc(`notificationsSent/${matchId}_upset_win`);
                if (!(await sentRef.get()).exists) {
                    await broadcast(Object.assign(Object.assign({ notification: {
                            title: '🚨 Upset!',
                            body: `${underdog} def. ${powerhouse} ${scoreStr} — Shock result!`,
                        }, data: { matchId, url: '/schedule', type: 'upset_win' } }, webpushOptions('/schedule', `upset-win-${matchId}`)), { android: { notification: { icon: 'ic_notification', priority: 'high' } } }));
                    await sentRef.set({ sentAt: admin.firestore.FieldValue.serverTimestamp(), matchId });
                    console.log(`Upset-win alert: ${underdog} beat ${powerhouse} in ${matchId}.`);
                }
            }
        }
    }
});
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
exports.morningResultsDigest = (0, scheduler_1.onSchedule)({
    schedule: '0 11 * * *',
    timeZone: 'UTC',
    timeoutSeconds: 60,
    memory: '256MiB',
}, async () => {
    const now = new Date();
    const tournamentStart = new Date('2026-06-11T00:00:00Z');
    const tournamentEnd = new Date('2026-07-20T00:00:00Z');
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
    const yesterdayMatches = Object.entries(schedule_1.MATCH_SCHEDULE).filter(([, entry]) => {
        return entry.kickoffAt.startsWith(yDateStr);
    });
    if (yesterdayMatches.length === 0) {
        console.log(`No scheduled matches on ${yDateStr} — no digest to send.`);
        return;
    }
    // Fetch Firestore docs for those matches in parallel
    const docs = await Promise.all(yesterdayMatches.map(([matchId]) => db.collection('matches').doc(matchId).get()));
    // Keep only matches that actually finished
    const results = [];
    for (let i = 0; i < yesterdayMatches.length; i++) {
        const [, entry] = yesterdayMatches[i];
        const data = docs[i].data();
        if (!data || data.status !== 'finished')
            continue;
        if (data.homeScore == null || data.awayScore == null)
            continue;
        results.push({
            home: entry.home || 'TBD',
            away: entry.away || 'TBD',
            homeScore: data.homeScore,
            awayScore: data.awayScore,
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
    const scoreLine = (r) => `${r.home} ${r.homeScore}–${r.awayScore} ${r.away}`;
    let body = shown.map(scoreLine).join(' · ');
    if (extra > 0)
        body += ` & ${extra} more`;
    await broadcast(Object.assign(Object.assign({ notification: {
            title: '⚽ Yesterday\'s WC Results',
            body,
        }, data: { url: '/schedule', type: 'digest', date: yDateStr } }, webpushOptions('/schedule', `digest-${yDateStr}`)), { android: {
            notification: { icon: 'ic_notification', priority: 'default' },
        } }));
    await sentRef.set({
        sentAt: admin.firestore.FieldValue.serverTimestamp(),
        date: yDateStr,
        matchCount: results.length,
    });
    console.log(`Digest sent for ${yDateStr}: ${results.length} result(s) — "${body}"`);
});
// ─── 3. Live Score Poller ─────────────────────────────────────────────────────
/**
 * ESPN public scoreboard API for the FIFA World Cup.
 * No API key required; returns all WC group-stage and knockout matches
 * with live scores, statuses, and kickoff times.
 *
 * NOTE: The original RapidAPI / FotMob endpoint (league ID 914609) only
 * covers pre-tournament warm-up friendlies and is NOT used for live scores.
 */
const ESPN_WC_SCOREBOARD = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard';
const ESPN_WC_SUMMARY = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/summary';
/** Maps ESPN status → our Firestore status string. */
function espnToAppStatus(status) {
    const { name, state, completed } = status.type;
    if (state === 'pre')
        return 'upcoming';
    if (state === 'post' || completed)
        return 'finished';
    if (name === 'STATUS_HALFTIME')
        return 'halftime';
    if (name === 'STATUS_OVERTIME' || name === 'STATUS_END_OVERTIME')
        return 'extratime';
    if (name === 'STATUS_SHOOTOUT' || name === 'STATUS_PENALTY')
        return 'penalties';
    return 'live';
}
function extractEspnScorers(summary, homeCode, awayCode) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t;
    const map = new Map();
    const add = (player, teamCode) => {
        var _a;
        if (!player)
            return;
        const key = `${player}::${teamCode}`;
        const entry = (_a = map.get(key)) !== null && _a !== void 0 ? _a : { player, teamCode, goals: 0 };
        entry.goals++;
        map.set(key, entry);
    };
    // ESPN keyEvents
    for (const ev of (_a = summary.keyEvents) !== null && _a !== void 0 ? _a : []) {
        const typeText = ((_c = (_b = ev.type) === null || _b === void 0 ? void 0 : _b.text) !== null && _c !== void 0 ? _c : '').toLowerCase();
        if (!typeText.includes('goal'))
            continue;
        // Skip OG and penalties (shootout)
        if (typeText.includes('own') || typeText.includes('penalty'))
            continue;
        if (((_e = (_d = ev.period) === null || _d === void 0 ? void 0 : _d.number) !== null && _e !== void 0 ? _e : 0) > 4)
            continue; // period 5+ = shootout
        const name = (_h = (_g = (_f = ev.athlete) === null || _f === void 0 ? void 0 : _f.displayName) !== null && _g !== void 0 ? _g : ev.text) !== null && _h !== void 0 ? _h : '';
        const teamCode = ev.homeAway === 'home' ? homeCode : awayCode;
        add(name, teamCode);
    }
    // Fallback: scoring plays
    if (map.size === 0) {
        for (const sp of (_j = summary.scoring) !== null && _j !== void 0 ? _j : []) {
            const typeText = ((_l = (_k = sp.type) === null || _k === void 0 ? void 0 : _k.text) !== null && _l !== void 0 ? _l : '').toLowerCase();
            if (!typeText.includes('goal'))
                continue;
            if (typeText.includes('own') || typeText.includes('penalty'))
                continue;
            if (((_o = (_m = sp.period) === null || _m === void 0 ? void 0 : _m.number) !== null && _o !== void 0 ? _o : 0) > 4)
                continue;
            const name = (_t = (_s = (_r = (_q = (_p = sp.participants) === null || _p === void 0 ? void 0 : _p[0]) === null || _q === void 0 ? void 0 : _q.athlete) === null || _r === void 0 ? void 0 : _r.displayName) !== null && _s !== void 0 ? _s : sp.text) !== null && _t !== void 0 ? _t : '';
            const teamCode = sp.homeAway === 'home' ? homeCode : awayCode;
            add(name, teamCode);
        }
    }
    return Array.from(map.values());
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
const TEAM_NAME_ALIASES = {
    // API says → schedule uses
    'Czech Republic': 'Czechia',
    'Bosnia Herzegovina': 'Bosnia & Herzegovina',
    'Bosnia and Herzegovina': 'Bosnia & Herzegovina',
    // 'United States' is correct in the schedule — no alias needed.
    // Add 'USA' as defensive alias in case the API returns the abbreviation.
    'USA': 'United States',
    'IR Iran': 'Iran',
    'Korea Republic': 'South Korea',
    'Republic of Korea': 'South Korea',
    'Ivory Coast': "Côte d'Ivoire",
    "Cote d'Ivoire": "Côte d'Ivoire",
    // 'DR Congo' is correct in the schedule — no alias needed.
    // Add 'Congo DR' as defensive alias in case the API returns the reversed form.
    'Congo DR': 'DR Congo',
    'Democratic Republic of Congo': 'DR Congo',
    'Republic of Congo': 'DR Congo',
    // Türkiye variants
    'Turkey': 'Türkiye',
};
/** Normalises a team name from the API to our canonical schedule name. */
function normalise(name) {
    var _a;
    return (_a = TEAM_NAME_ALIASES[name]) !== null && _a !== void 0 ? _a : name;
}
/**
 * Builds a reverse lookup: "Home|Away" → matchId
 * for group-stage matches where both team names are known upfront.
 */
function buildTeamPairIndex() {
    const idx = new Map();
    for (const [matchId, entry] of Object.entries(schedule_1.MATCH_SCHEDULE)) {
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
function buildKickoffIndex() {
    const idx = new Map();
    for (const [matchId, entry] of Object.entries(schedule_1.MATCH_SCHEDULE)) {
        // Only index knockout slots — identified by empty home/away
        if (!entry.home && !entry.away && entry.kickoffAt) {
            const key = new Date(entry.kickoffAt).toISOString().slice(0, 16);
            idx.set(key, matchId);
        }
    }
    return idx;
}
/**
 * Polls the ESPN public scoreboard for today's World Cup matches every 2 min
 * and writes updated scores + status to Firestore.
 * No API key required — ESPN serves WC data publicly.
 *
 * The onMatchStatusChange trigger fires notifications automatically whenever
 * status or scores change in Firestore.
 */
exports.pollLiveScores = (0, scheduler_1.onSchedule)({
    schedule: 'every 2 minutes',
    timeoutSeconds: 60,
    memory: '256MiB',
}, async () => {
    var _a, _b, _c, _d;
    // Only run during the tournament window
    const now = new Date();
    const start = new Date('2026-06-11T00:00:00Z');
    const end = new Date('2026-07-20T00:00:00Z');
    if (now < start || now > end) {
        console.log('Outside tournament window — skipping poll.');
        return;
    }
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const url = `${ESPN_WC_SCOREBOARD}?dates=${dateStr}`;
    let events = [];
    try {
        const res = await (0, node_fetch_1.default)(url);
        if (!res.ok) {
            console.error(`ESPN API HTTP ${res.status}`);
            await db.doc('pollDiagnostics/latest').set({
                checkedAt: admin.firestore.FieldValue.serverTimestamp(),
                source: 'espn', date: dateStr, httpStatus: res.status,
            }, { merge: true });
            return;
        }
        const json = await res.json();
        events = (_a = json.events) !== null && _a !== void 0 ? _a : [];
    }
    catch (err) {
        console.error('ESPN fetch failed:', err);
        await db.doc('pollDiagnostics/latest').set({
            checkedAt: admin.firestore.FieldValue.serverTimestamp(),
            source: 'espn', date: dateStr, error: String(err),
        }, { merge: true });
        return;
    }
    // Write diagnostic — useful for verifying team names and statuses
    await db.doc('pollDiagnostics/latest').set({
        checkedAt: admin.firestore.FieldValue.serverTimestamp(),
        source: 'espn',
        date: dateStr,
        totalEvents: events.length,
        sampleEvents: events.slice(0, 8).map((ev) => {
            var _a, _b, _c, _d, _e, _f, _g;
            const comp = (_a = ev.competitions) === null || _a === void 0 ? void 0 : _a[0];
            const home = comp === null || comp === void 0 ? void 0 : comp.competitors.find((c) => c.homeAway === 'home');
            const away = comp === null || comp === void 0 ? void 0 : comp.competitors.find((c) => c.homeAway === 'away');
            return {
                id: ev.id,
                home: (_b = home === null || home === void 0 ? void 0 : home.team.displayName) !== null && _b !== void 0 ? _b : '?',
                away: (_c = away === null || away === void 0 ? void 0 : away.team.displayName) !== null && _c !== void 0 ? _c : '?',
                score: `${(_d = home === null || home === void 0 ? void 0 : home.score) !== null && _d !== void 0 ? _d : 0}-${(_e = away === null || away === void 0 ? void 0 : away.score) !== null && _e !== void 0 ? _e : 0}`,
                status: (_f = comp === null || comp === void 0 ? void 0 : comp.status.type.name) !== null && _f !== void 0 ? _f : '?',
                detail: (_g = comp === null || comp === void 0 ? void 0 : comp.status.type.detail) !== null && _g !== void 0 ? _g : '',
            };
        }),
    }, { merge: true });
    if (events.length === 0) {
        console.log(`No ESPN WC events for ${dateStr}.`);
        return;
    }
    console.log(`ESPN: ${events.length} WC events for ${dateStr}.`);
    const teamPairIndex = buildTeamPairIndex();
    const kickoffIndex = buildKickoffIndex();
    const batch = db.batch();
    let updateCount = 0;
    for (const ev of events) {
        const comp = (_b = ev.competitions) === null || _b === void 0 ? void 0 : _b[0];
        if (!comp)
            continue;
        const homeComp = comp.competitors.find((c) => c.homeAway === 'home');
        const awayComp = comp.competitors.find((c) => c.homeAway === 'away');
        if (!homeComp || !awayComp)
            continue;
        const homeNorm = normalise(homeComp.team.displayName);
        const awayNorm = normalise(awayComp.team.displayName);
        // Primary lookup by team-name pair
        let matchId = teamPairIndex.get(`${homeNorm}|${awayNorm}`);
        // Fallback for knockout slots: match by kickoff time
        if (!matchId) {
            const kickoffStr = (_d = (_c = comp.date) !== null && _c !== void 0 ? _c : ev.date) !== null && _d !== void 0 ? _d : '';
            const apiKickoff = kickoffStr
                ? new Date(kickoffStr).toISOString().slice(0, 16)
                : null;
            if (apiKickoff)
                matchId = kickoffIndex.get(apiKickoff);
            if (matchId) {
                console.log(`  Knockout via kickoff ${apiKickoff} → ${matchId} (${homeNorm} vs ${awayNorm})`);
            }
        }
        if (!matchId) {
            console.warn(`No schedule entry for "${homeNorm} vs ${awayNorm}" — skipping.`);
            continue;
        }
        const appStatus = espnToAppStatus(comp.status);
        const homeScore = parseInt(homeComp.score, 10);
        const awayScore = parseInt(awayComp.score, 10);
        batch.set(db.collection('matches').doc(matchId), {
            homeScore,
            awayScore,
            status: appStatus,
            lastSyncAt: admin.firestore.FieldValue.serverTimestamp(),
            espnEventId: ev.id,
        }, { merge: true });
        updateCount++;
        console.log(`  ${matchId}: ${homeNorm} ${homeScore}–${awayScore} ${awayNorm} [${appStatus}]`);
    }
    if (updateCount > 0) {
        await batch.commit();
        console.log(`Committed ${updateCount} match updates.`);
    }
    // ── Goal scorers via ESPN summary ─────────────────────────────────────
    // For every live or finished event, call the ESPN summary endpoint to
    // extract goal scorers and write them to the match doc.
    const liveOrDone = events.filter((ev) => {
        var _a, _b;
        const comp = (_a = ev.competitions) === null || _a === void 0 ? void 0 : _a[0];
        const state = (_b = comp === null || comp === void 0 ? void 0 : comp.status.type.state) !== null && _b !== void 0 ? _b : 'pre';
        return state === 'in' || state === 'post';
    });
    if (liveOrDone.length === 0)
        return;
    await Promise.allSettled(liveOrDone.map(async (ev) => {
        var _a, _b, _c, _d, _e;
        const comp = (_a = ev.competitions) === null || _a === void 0 ? void 0 : _a[0];
        const homeComp = comp === null || comp === void 0 ? void 0 : comp.competitors.find((c) => c.homeAway === 'home');
        const awayComp = comp === null || comp === void 0 ? void 0 : comp.competitors.find((c) => c.homeAway === 'away');
        if (!homeComp || !awayComp)
            return;
        const homeNorm = normalise(homeComp.team.displayName);
        const awayNorm = normalise(awayComp.team.displayName);
        let matchId = teamPairIndex.get(`${homeNorm}|${awayNorm}`);
        if (!matchId) {
            const kickoffStr = (_c = (_b = comp === null || comp === void 0 ? void 0 : comp.date) !== null && _b !== void 0 ? _b : ev.date) !== null && _c !== void 0 ? _c : '';
            const apiKickoff = kickoffStr
                ? new Date(kickoffStr).toISOString().slice(0, 16)
                : null;
            if (apiKickoff)
                matchId = kickoffIndex.get(apiKickoff);
        }
        if (!matchId)
            return;
        const homeCode = (_d = TEAM_NAME_TO_CODE[homeNorm]) !== null && _d !== void 0 ? _d : homeNorm.slice(0, 3).toUpperCase();
        const awayCode = (_e = TEAM_NAME_TO_CODE[awayNorm]) !== null && _e !== void 0 ? _e : awayNorm.slice(0, 3).toUpperCase();
        try {
            const summaryRes = await (0, node_fetch_1.default)(`${ESPN_WC_SUMMARY}?event=${ev.id}`);
            if (!summaryRes.ok)
                return;
            const summary = await summaryRes.json();
            const scorers = extractEspnScorers(summary, homeCode, awayCode);
            // Derive flat scorer name arrays for calcPoints / MatchCard scoring logic
            const homeScorers = scorers
                .filter((s) => s.teamCode === homeCode)
                .map((s) => s.player);
            const awayScorers = scorers
                .filter((s) => s.teamCode === awayCode)
                .map((s) => s.player);
            await db.collection('matches').doc(matchId).set({ goalScorerEvents: scorers, homeScorers, awayScorers }, { merge: true });
            if (scorers.length > 0) {
                console.log(`  Goal scorers ${matchId}: ` +
                    scorers.map((s) => `${s.player}(${s.teamCode})×${s.goals}`).join(', '));
            }
        }
        catch (err) {
            console.warn(`ESPN summary failed for ${matchId} (espnId=${ev.id}):`, err);
        }
    }));
});
//# sourceMappingURL=index.js.map