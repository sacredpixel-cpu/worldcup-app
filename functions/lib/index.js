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
const params_1 = require("firebase-functions/params");
const node_fetch_1 = __importDefault(require("node-fetch"));
const schedule_1 = require("./schedule");
// Firebase Secret — set with: firebase functions:secrets:set RAPIDAPI_KEY
const RAPIDAPI_KEY = (0, params_1.defineSecret)('RAPIDAPI_KEY');
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
    // ── 4. Upset alert ────────────────────────────────────────────────────
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
            if (newStatus === 'live' && underdogAhead) {
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
            if (newStatus === 'finished' && underdogAhead) {
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
function toAppStatus(m) {
    if (!m.status.started)
        return 'upcoming';
    if (m.status.finished)
        return 'finished';
    const sid = m.statusId;
    if (sid === 3)
        return 'halftime';
    if (sid === 6 || sid === 7)
        return 'extratime';
    if (sid === 8)
        return 'penalties';
    return 'live';
}
/**
 * Extracts goal scorers from a FotMob match-details response.
 * Excludes own goals and penalty-shootout goals (per Golden Boot rules).
 *
 * Tries two data sources in order:
 *   1. content.shotmap.shots  — most reliable (per-shot granularity)
 *   2. content.matchFacts.events.events — fallback event list
 */
function extractGoalScorers(details, homeCode, awayCode) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w;
    const homeTeamId = (_c = (_b = (_a = details.header) === null || _a === void 0 ? void 0 : _a.teams) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.id;
    const awayTeamId = (_f = (_e = (_d = details.header) === null || _d === void 0 ? void 0 : _d.teams) === null || _e === void 0 ? void 0 : _e[1]) === null || _f === void 0 ? void 0 : _f.id;
    const map = new Map();
    const add = (playerName, teamCode) => {
        var _a;
        if (!playerName)
            return;
        const key = `${playerName}::${teamCode}`;
        const entry = (_a = map.get(key)) !== null && _a !== void 0 ? _a : { player: playerName, teamCode, goals: 0 };
        entry.goals++;
        map.set(key, entry);
    };
    const resolveTeam = (teamId, isHome) => {
        if (isHome !== undefined)
            return isHome ? homeCode : awayCode;
        if (homeTeamId && teamId === homeTeamId)
            return homeCode;
        if (awayTeamId && teamId === awayTeamId)
            return awayCode;
        return homeCode; // fallback
    };
    // Method 1: shotmap
    const shots = (_j = (_h = (_g = details.content) === null || _g === void 0 ? void 0 : _g.shotmap) === null || _h === void 0 ? void 0 : _h.shots) !== null && _j !== void 0 ? _j : [];
    for (const s of shots) {
        if (s.eventType !== 'Goal')
            continue;
        if (s.isOwnGoal)
            continue;
        if (String((_k = s.period) !== null && _k !== void 0 ? _k : '').toLowerCase().includes('penalt'))
            continue;
        const name = s.playerName || `${(_l = s.firstName) !== null && _l !== void 0 ? _l : ''} ${(_m = s.lastName) !== null && _m !== void 0 ? _m : ''}`.trim();
        add(name, resolveTeam(s.teamId));
    }
    // Method 2: matchFacts events (fallback if shotmap empty)
    if (map.size === 0) {
        const events = (_r = (_q = (_p = (_o = details.content) === null || _o === void 0 ? void 0 : _o.matchFacts) === null || _p === void 0 ? void 0 : _p.events) === null || _q === void 0 ? void 0 : _q.events) !== null && _r !== void 0 ? _r : [];
        for (const ev of events) {
            const typeId = typeof ev.type === 'string' ? ev.type : (_t = (_s = ev.type) === null || _s === void 0 ? void 0 : _s.id) !== null && _t !== void 0 ? _t : '';
            if (typeId !== 'Goal' && typeId !== 'PenGoal')
                continue;
            if (ev.isOwnGoal)
                continue;
            if (String((_u = ev.period) !== null && _u !== void 0 ? _u : '').toLowerCase().includes('penalt'))
                continue;
            const name = (_w = (_v = ev.player) === null || _v === void 0 ? void 0 : _v.name) !== null && _w !== void 0 ? _w : '';
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
exports.pollLiveScores = (0, scheduler_1.onSchedule)({
    schedule: 'every 2 minutes',
    secrets: [RAPIDAPI_KEY],
    timeoutSeconds: 60,
    memory: '256MiB',
}, async () => {
    var _a, _b;
    // Only run during the tournament window
    const now = new Date();
    const start = new Date('2026-06-11T00:00:00Z');
    const end = new Date('2026-07-20T00:00:00Z');
    if (now < start || now > end) {
        console.log('Outside tournament window — skipping poll.');
        return;
    }
    const key = RAPIDAPI_KEY.value();
    if (!key) {
        console.error('RAPIDAPI_KEY secret not set.');
        return;
    }
    // Fetch today's matches from the API (YYYYMMDD format)
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const url = `https://${RAPIDAPI_HOST}/football-get-matches-by-date?date=${dateStr}`;
    let apiMatches = [];
    try {
        const res = await (0, node_fetch_1.default)(url, {
            headers: {
                'x-rapidapi-host': RAPIDAPI_HOST,
                'x-rapidapi-key': key,
            },
        });
        const json = await res.json();
        if (json.status !== 'success') {
            console.error('API returned non-success:', JSON.stringify(json));
            return;
        }
        apiMatches = ((_b = (_a = json.response) === null || _a === void 0 ? void 0 : _a.matches) !== null && _b !== void 0 ? _b : []).filter((m) => m.leagueId === WC_LEAGUE_ID);
    }
    catch (err) {
        console.error('Failed to fetch live scores:', err);
        return;
    }
    if (apiMatches.length === 0) {
        console.log(`No WC matches found for date ${dateStr}.`);
        return;
    }
    console.log(`Found ${apiMatches.length} WC matches for ${dateStr}.`);
    const teamPairIndex = buildTeamPairIndex();
    const kickoffIndex = buildKickoffIndex(); // fallback for knockout matches (TBD teams)
    const batch = db.batch();
    let updateCount = 0;
    for (const m of apiMatches) {
        const homeNorm = normalise(m.home.name);
        const awayNorm = normalise(m.away.name);
        // Primary lookup: team-name pair (works for all group-stage matches)
        let matchId = teamPairIndex.get(`${homeNorm}|${awayNorm}`);
        // Fallback for knockout matches whose slots have blank home/away in the schedule:
        // match by kickoff time (each knockout slot has a unique UTC kickoff minute).
        if (!matchId) {
            const apiKickoff = m.status.utcTime
                ? new Date(m.status.utcTime).toISOString().slice(0, 16)
                : null;
            if (apiKickoff)
                matchId = kickoffIndex.get(apiKickoff);
            if (matchId) {
                console.log(`  Knockout slot via kickoff ${apiKickoff} → ${matchId} (${homeNorm} vs ${awayNorm})`);
            }
        }
        if (!matchId) {
            console.warn(`No schedule entry for "${homeNorm} vs ${awayNorm}" — skipping.`);
            continue;
        }
        const appStatus = toAppStatus(m);
        const docRef = db.collection('matches').doc(matchId);
        const update = {
            homeScore: m.home.score,
            awayScore: m.away.score,
            status: appStatus,
            lastSyncAt: admin.firestore.FieldValue.serverTimestamp(),
            apiMatchId: m.id,
        };
        // Include penalty scores when present
        if (m.home.penScore !== undefined)
            update.homePenScore = m.home.penScore;
        if (m.away.penScore !== undefined)
            update.awayPenScore = m.away.penScore;
        batch.set(docRef, update, { merge: true });
        updateCount++;
        console.log(`  ${matchId}: ${homeNorm} ${m.home.score}–${m.away.score} ${awayNorm} [${appStatus}]`);
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
    if (liveOrDone.length === 0)
        return;
    let detailsLogged = false; // log raw response once per poll for debugging
    await Promise.allSettled(liveOrDone.map(async (m) => {
        var _a, _b, _c;
        const homeNorm = normalise(m.home.name);
        const awayNorm = normalise(m.away.name);
        let matchId = teamPairIndex.get(`${homeNorm}|${awayNorm}`);
        if (!matchId) {
            // Same kickoff-time fallback as the score-update loop above
            const apiKickoff = m.status.utcTime
                ? new Date(m.status.utcTime).toISOString().slice(0, 16)
                : null;
            if (apiKickoff)
                matchId = kickoffIndex.get(apiKickoff);
        }
        if (!matchId)
            return;
        const homeCode = (_a = TEAM_NAME_TO_CODE[homeNorm]) !== null && _a !== void 0 ? _a : homeNorm.slice(0, 3).toUpperCase();
        const awayCode = (_b = TEAM_NAME_TO_CODE[awayNorm]) !== null && _b !== void 0 ? _b : awayNorm.slice(0, 3).toUpperCase();
        const detailUrl = `https://${RAPIDAPI_HOST}/football-get-match-details?match_id=${m.id}`;
        let detailsJson;
        try {
            const res = await (0, node_fetch_1.default)(detailUrl, {
                headers: {
                    'x-rapidapi-host': RAPIDAPI_HOST,
                    'x-rapidapi-key': key,
                },
            });
            if (!res.ok) {
                console.warn(`match-details HTTP ${res.status} for ${matchId} (apiId=${m.id})`);
                return;
            }
            detailsJson = await res.json();
        }
        catch (err) {
            console.error(`match-details fetch failed for ${matchId}:`, err);
            return;
        }
        // Log the raw structure once per poll run so we can verify field paths
        if (!detailsLogged) {
            detailsLogged = true;
            console.log(`match-details sample (${matchId}):`, JSON.stringify(detailsJson).slice(0, 1500));
        }
        // Unwrap response envelope if present
        const envelope = detailsJson;
        const details = (_c = envelope.response) !== null && _c !== void 0 ? _c : detailsJson;
        const scorers = extractGoalScorers(details, homeCode, awayCode);
        // Always write (even if empty) so UI knows we've checked
        await db.collection('matches').doc(matchId).set({ goalScorerEvents: scorers }, { merge: true });
        if (scorers.length > 0) {
            console.log(`  Goal scorers ${matchId}: ` +
                scorers.map(s => `${s.player}(${s.teamCode})×${s.goals}`).join(', '));
        }
    }));
});
//# sourceMappingURL=index.js.map