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
 * RapidAPI "Free API Live Football Data" — used for scores & status.
 * WC 2026 group stage is leagueId 894790.
 * Endpoint: football-get-matches-by-date?date=YYYYMMDD
 */
const RAPIDAPI_HOST = 'free-api-live-football-data.p.rapidapi.com';
const RAPIDAPI_BY_DATE = `https://${RAPIDAPI_HOST}/football-get-matches-by-date`;
const WC_2026_LEAGUE_ID = 894790;
/**
 * ESPN public scoreboard + summary — used ONLY for goal scorer data.
 * No API key required.
 */
const ESPN_WC_SCOREBOARD = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard';
const ESPN_WC_SUMMARY = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/summary';
/** Maps a RapidAPI match status → our Firestore status string. */
function rapidToAppStatus(m) {
    var _a;
    const { started, finished, cancelled, reason } = m.status;
    if (cancelled)
        return 'upcoming'; // treat as not started
    if (!started)
        return 'upcoming';
    if (finished)
        return 'finished';
    const short = ((_a = reason === null || reason === void 0 ? void 0 : reason.short) !== null && _a !== void 0 ? _a : '').toUpperCase();
    if (short === 'HT')
        return 'halftime';
    if (short === 'AET' || short === 'ET')
        return 'extratime';
    if (short === 'PEN' || short === 'PENS')
        return 'penalties';
    return 'live';
}
function extractEspnScorers(summary, homeCode, awayCode, homeNorm, awayNorm) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y;
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
    // Resolve teamCode from an event's team.displayName (if available),
    // falling back to homeAway string, then defaulting to awayCode.
    const resolveTeamCode = (ev) => {
        var _a;
        if (((_a = ev.team) === null || _a === void 0 ? void 0 : _a.displayName) && homeNorm) {
            return normalise(ev.team.displayName) === homeNorm ? homeCode : awayCode;
        }
        if (ev.homeAway === 'home')
            return homeCode;
        if (ev.homeAway === 'away')
            return awayCode;
        return awayCode;
    };
    // ESPN keyEvents — scoring plays carry scoringPlay:true and
    // have the scorer in participants[0].athlete.displayName.
    // Penalty goals have type.type="penalty---scored" (not "goal"), so we include them explicitly.
    for (const ev of (_a = summary.keyEvents) !== null && _a !== void 0 ? _a : []) {
        if (!ev.scoringPlay)
            continue;
        const typeText = ((_c = (_b = ev.type) === null || _b === void 0 ? void 0 : _b.text) !== null && _c !== void 0 ? _c : '').toLowerCase();
        const typeType = ((_e = (_d = ev.type) === null || _d === void 0 ? void 0 : _d.type) !== null && _e !== void 0 ? _e : '').toLowerCase();
        const isGoal = typeText.includes('goal') || typeType.includes('goal');
        const isPenalty = typeType === 'penalty---scored';
        if (!isGoal && !isPenalty)
            continue;
        // Skip own goals and penalty shootout goals
        if (typeText.includes('own') || typeType.includes('own'))
            continue;
        if (((_g = (_f = ev.period) === null || _f === void 0 ? void 0 : _f.number) !== null && _g !== void 0 ? _g : 0) > 4)
            continue; // period 5+ = shootout
        // Scorer is first participant; fall back to shortText name or full text
        const name = (_o = (_l = (_k = (_j = (_h = ev.participants) === null || _h === void 0 ? void 0 : _h[0]) === null || _j === void 0 ? void 0 : _j.athlete) === null || _k === void 0 ? void 0 : _k.displayName) !== null && _l !== void 0 ? _l : (_m = ev.athlete) === null || _m === void 0 ? void 0 : _m.displayName) !== null && _o !== void 0 ? _o : '';
        const teamCode = resolveTeamCode(ev);
        add(name, teamCode);
    }
    // Fallback: summary.scoring array (some ESPN leagues use this instead)
    if (map.size === 0) {
        for (const sp of (_p = summary.scoring) !== null && _p !== void 0 ? _p : []) {
            const typeText = ((_r = (_q = sp.type) === null || _q === void 0 ? void 0 : _q.text) !== null && _r !== void 0 ? _r : '').toLowerCase();
            if (!typeText.includes('goal'))
                continue;
            if (typeText.includes('own'))
                continue;
            if (((_t = (_s = sp.period) === null || _s === void 0 ? void 0 : _s.number) !== null && _t !== void 0 ? _t : 0) > 4)
                continue;
            const name = (_y = (_x = (_w = (_v = (_u = sp.participants) === null || _u === void 0 ? void 0 : _u[0]) === null || _v === void 0 ? void 0 : _v.athlete) === null || _w === void 0 ? void 0 : _w.displayName) !== null && _x !== void 0 ? _x : sp.text) !== null && _y !== void 0 ? _y : '';
            const teamCode = sp.homeAway === 'home' ? homeCode : awayCode;
            add(name, teamCode);
        }
    }
    return Array.from(map.values());
}
function extractMatchEvents(summary, homeNorm) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t;
    const events = [];
    for (const ev of (_a = summary.keyEvents) !== null && _a !== void 0 ? _a : []) {
        const typeType = (_c = (_b = ev.type) === null || _b === void 0 ? void 0 : _b.type) !== null && _c !== void 0 ? _c : '';
        const isPenaltyGoal = typeType === 'penalty---scored';
        const isGoal = typeType.includes('goal') || isPenaltyGoal;
        const isYellow = typeType === 'yellow-card';
        const isRed = typeType === 'red-card';
        if (!isGoal && !isYellow && !isRed)
            continue;
        if (isGoal && ((_e = (_d = ev.period) === null || _d === void 0 ? void 0 : _d.number) !== null && _e !== void 0 ? _e : 0) > 4)
            continue; // no shootout goals
        if (typeType.includes('own'))
            continue; // skip own goals
        const minute = (_g = (_f = ev.clock) === null || _f === void 0 ? void 0 : _f.displayValue) !== null && _g !== void 0 ? _g : '';
        const minuteSort = (_j = (_h = ev.clock) === null || _h === void 0 ? void 0 : _h.value) !== null && _j !== void 0 ? _j : 0;
        const teamName = (_l = (_k = ev.team) === null || _k === void 0 ? void 0 : _k.displayName) !== null && _l !== void 0 ? _l : '';
        const teamSide = normalise(teamName) === homeNorm ? 'home' : 'away';
        let eventType;
        let player;
        if (isGoal) {
            eventType = 'goal';
            const rawName = (_q = (_p = (_o = (_m = ev.participants) === null || _m === void 0 ? void 0 : _m[0]) === null || _o === void 0 ? void 0 : _o.athlete) === null || _p === void 0 ? void 0 : _p.displayName) !== null && _q !== void 0 ? _q : ((_r = ev.shortText) !== null && _r !== void 0 ? _r : '').replace(/ (Goal|Penalty).*$/i, '').trim();
            // Tag penalty goals with (P) so the UI can display it distinctly
            player = isPenaltyGoal ? `${rawName} (P)` : rawName;
        }
        else if (isYellow) {
            eventType = 'yellow-card';
            player = ((_s = ev.shortText) !== null && _s !== void 0 ? _s : '').replace(/ Yellow Card$/i, '').trim();
        }
        else {
            eventType = 'red-card';
            player = ((_t = ev.shortText) !== null && _t !== void 0 ? _t : '').replace(/ Red Card$/i, '').trim();
        }
        if (!player)
            continue;
        events.push({ type: eventType, player, teamSide, minute, minuteSort });
    }
    return events.sort((a, b) => a.minuteSort - b.minuteSort);
}
function extractMatchStats(summary, homeNorm) {
    var _a, _b;
    const teams = (_b = (_a = summary.boxscore) === null || _a === void 0 ? void 0 : _a.teams) !== null && _b !== void 0 ? _b : [];
    if (teams.length < 2)
        return null;
    const homeTeam = teams.find((t) => { var _a, _b; return normalise((_b = (_a = t.team) === null || _a === void 0 ? void 0 : _a.displayName) !== null && _b !== void 0 ? _b : '') === homeNorm; });
    const awayTeam = teams.find((t) => { var _a, _b; return normalise((_b = (_a = t.team) === null || _a === void 0 ? void 0 : _a.displayName) !== null && _b !== void 0 ? _b : '') !== homeNorm; });
    if (!homeTeam || !awayTeam)
        return null;
    const getStat = (teamData, name) => {
        var _a, _b;
        const stat = (_a = teamData === null || teamData === void 0 ? void 0 : teamData.statistics) === null || _a === void 0 ? void 0 : _a.find((s) => s.name === name);
        return parseFloat((_b = stat === null || stat === void 0 ? void 0 : stat.displayValue) !== null && _b !== void 0 ? _b : '0') || 0;
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
const TEAM_NAME_ALIASES = {
    // API says → schedule uses
    'Czech Republic': 'Czechia',
    'Bosnia Herzegovina': 'Bosnia & Herzegovina',
    'Bosnia and Herzegovina': 'Bosnia & Herzegovina',
    'Bosnia-Herzegovina': 'Bosnia & Herzegovina',
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
 * Polls RapidAPI for today's World Cup scores every 2 min and writes to
 * Firestore. Goal scorers are fetched separately from ESPN (free, no key).
 *
 * The onMatchStatusChange trigger fires notifications whenever status or
 * scores change in Firestore.
 */
exports.pollLiveScores = (0, scheduler_1.onSchedule)({
    schedule: 'every 1 minutes',
    timeoutSeconds: 60,
    memory: '256MiB',
    secrets: [RAPIDAPI_KEY],
}, async () => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    // Only run during the tournament window
    const now = new Date();
    const start = new Date('2026-06-11T00:00:00Z');
    const end = new Date('2026-07-20T00:00:00Z');
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
    const apiKey = RAPIDAPI_KEY.value().trim(); // trim newline that may be appended by secret manager
    const fetchRapidDate = async (ds) => {
        var _a, _b;
        const res = await (0, node_fetch_1.default)(`${RAPIDAPI_BY_DATE}?date=${ds}`, {
            headers: {
                'x-rapidapi-key': apiKey,
                'x-rapidapi-host': RAPIDAPI_HOST,
            },
        });
        if (!res.ok)
            return [];
        const json = await res.json();
        const all = (_b = (_a = json === null || json === void 0 ? void 0 : json.response) === null || _a === void 0 ? void 0 : _a.matches) !== null && _b !== void 0 ? _b : [];
        // Filter to WC 2026 group stage only
        return all.filter((m) => m.leagueId === WC_2026_LEAGUE_ID);
    };
    let rapidMatches = [];
    try {
        const [todayMatches, ydayMatches] = await Promise.all([
            fetchRapidDate(dateStr),
            fetchRapidDate(yDateStr),
        ]);
        // De-duplicate by match id
        const seen = new Set();
        for (const m of [...todayMatches, ...ydayMatches]) {
            if (!seen.has(m.id)) {
                seen.add(m.id);
                rapidMatches.push(m);
            }
        }
    }
    catch (err) {
        console.error('RapidAPI fetch failed:', err);
        await db.doc('pollDiagnostics/latest').set({
            checkedAt: admin.firestore.FieldValue.serverTimestamp(),
            source: 'rapidapi', date: dateStr, error: String(err),
        }, { merge: true });
        return;
    }
    // Write diagnostic
    await db.doc('pollDiagnostics/latest').set({
        checkedAt: admin.firestore.FieldValue.serverTimestamp(),
        source: 'rapidapi',
        date: dateStr,
        totalMatches: rapidMatches.length,
        sampleMatches: rapidMatches.slice(0, 8).map((m) => {
            var _a, _b;
            return ({
                id: m.id,
                home: m.home.name,
                away: m.away.name,
                score: `${m.home.score}-${m.away.score}`,
                status: (_b = (_a = m.status.reason) === null || _a === void 0 ? void 0 : _a.short) !== null && _b !== void 0 ? _b : (m.status.finished ? 'FT' : m.status.started ? 'Live' : 'Sched'),
            });
        }),
    }, { merge: true });
    // Always build indexes — needed by both RapidAPI and ESPN supplementary sections.
    const teamPairIndex = buildTeamPairIndex();
    const kickoffIndex = buildKickoffIndex();
    if (rapidMatches.length === 0) {
        console.log(`No RapidAPI WC matches for ${dateStr} or ${yDateStr} — will try ESPN.`);
    }
    else {
        console.log(`RapidAPI: ${rapidMatches.length} WC matches for ${dateStr}+${yDateStr}.`);
    }
    const batch = db.batch();
    let updateCount = 0;
    for (const m of rapidMatches) {
        const homeNorm = normalise(m.home.longName || m.home.name);
        const awayNorm = normalise(m.away.longName || m.away.name);
        // Primary lookup by team-name pair
        let matchId = teamPairIndex.get(`${homeNorm}|${awayNorm}`);
        // Fallback for knockout slots: match by kickoff UTC time
        if (!matchId) {
            const apiKickoff = m.status.utcTime
                ? new Date(m.status.utcTime).toISOString().slice(0, 16)
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
        const appStatus = rapidToAppStatus(m);
        const homeScore = (_a = m.home.score) !== null && _a !== void 0 ? _a : 0;
        const awayScore = (_b = m.away.score) !== null && _b !== void 0 ? _b : 0;
        batch.set(db.collection('matches').doc(matchId), {
            homeScore,
            awayScore,
            status: appStatus,
            lastSyncAt: admin.firestore.FieldValue.serverTimestamp(),
            rapidMatchId: m.id,
        }, { merge: true });
        updateCount++;
        console.log(`  ${matchId}: ${homeNorm} ${homeScore}–${awayScore} ${awayNorm} [${appStatus}]`);
    }
    if (updateCount > 0) {
        await batch.commit();
        console.log(`Committed ${updateCount} match updates.`);
    }
    // ── ESPN scoreboard — fetch early so we can supplement RapidAPI gaps ─────
    // RapidAPI sometimes misses matches (e.g. different leagueId per group).
    // ESPN is free, covers all WC matches, and serves as both a fallback score
    // source and the canonical scorer/stats source.
    const fetchEspnDate = async (ds) => {
        var _a;
        const res = await (0, node_fetch_1.default)(`${ESPN_WC_SCOREBOARD}?dates=${ds}`);
        if (!res.ok)
            return [];
        const json = await res.json();
        return (_a = json.events) !== null && _a !== void 0 ? _a : [];
    };
    let espnEvents = [];
    try {
        const [todayEspn, ydayEspn] = await Promise.all([
            fetchEspnDate(dateStr),
            fetchEspnDate(yDateStr),
        ]);
        const seenEspn = new Set();
        for (const ev of [...todayEspn, ...ydayEspn]) {
            if (!seenEspn.has(ev.id)) {
                seenEspn.add(ev.id);
                espnEvents.push(ev);
            }
        }
    }
    catch (_k) {
        console.warn('ESPN scoreboard fetch failed — skipping scorer update.');
    }
    // Build matchId → ESPN event lookup
    const matchToEspnEvent = new Map();
    for (const ev of espnEvents) {
        const comp = (_c = ev.competitions) === null || _c === void 0 ? void 0 : _c[0];
        const homeComp = comp === null || comp === void 0 ? void 0 : comp.competitors.find((c) => c.homeAway === 'home');
        const awayComp = comp === null || comp === void 0 ? void 0 : comp.competitors.find((c) => c.homeAway === 'away');
        if (!homeComp || !awayComp)
            continue;
        const hNorm = normalise(homeComp.team.displayName);
        const aNorm = normalise(awayComp.team.displayName);
        const mid = teamPairIndex.get(`${hNorm}|${aNorm}`);
        if (mid)
            matchToEspnEvent.set(mid, ev);
    }
    // ── ESPN supplementary scores ──────────────────────────────────────────
    // Write live/finished scores from ESPN for any match that RapidAPI missed.
    const rapidWrittenIds = new Set();
    for (const m of rapidMatches) {
        const hNorm = normalise(m.home.longName || m.home.name);
        const aNorm = normalise(m.away.longName || m.away.name);
        const mid = teamPairIndex.get(`${hNorm}|${aNorm}`);
        if (mid)
            rapidWrittenIds.add(mid);
    }
    const espnOnlyLiveDoneIds = new Set();
    const espnScoreBatch = db.batch();
    let espnScoreCount = 0;
    for (const [mid, ev] of matchToEspnEvent) {
        if (rapidWrittenIds.has(mid))
            continue; // RapidAPI already handled this
        const st = (_f = (_e = (_d = ev.competitions) === null || _d === void 0 ? void 0 : _d[0]) === null || _e === void 0 ? void 0 : _e.status) === null || _f === void 0 ? void 0 : _f.type;
        if (!st)
            continue;
        let appStatus = null;
        if (st.completed || st.name === 'STATUS_FINAL' || st.name === 'STATUS_FULL_TIME') {
            appStatus = 'finished';
        }
        else if (st.name === 'STATUS_HALFTIME') {
            appStatus = 'halftime';
        }
        else if (st.state === 'in' || st.name === 'STATUS_IN_PROGRESS' || st.name === 'STATUS_END_PERIOD') {
            appStatus = 'live';
        }
        if (!appStatus)
            continue;
        const comp = (_g = ev.competitions) === null || _g === void 0 ? void 0 : _g[0];
        const homeComp = comp === null || comp === void 0 ? void 0 : comp.competitors.find((c) => c.homeAway === 'home');
        const awayComp = comp === null || comp === void 0 ? void 0 : comp.competitors.find((c) => c.homeAway === 'away');
        if (!homeComp || !awayComp)
            continue;
        const homeScore = parseInt((_h = homeComp.score) !== null && _h !== void 0 ? _h : '0', 10);
        const awayScore = parseInt((_j = awayComp.score) !== null && _j !== void 0 ? _j : '0', 10);
        espnScoreBatch.set(db.collection('matches').doc(mid), { homeScore, awayScore, status: appStatus, lastSyncAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
        espnScoreCount++;
        espnOnlyLiveDoneIds.add(mid);
        console.log(`  ESPN supplement: ${mid} ${homeComp.team.displayName} ${homeScore}–${awayScore} ${awayComp.team.displayName} [${appStatus}]`);
    }
    if (espnScoreCount > 0) {
        await espnScoreBatch.commit();
        console.log(`ESPN supplement: committed ${espnScoreCount} score updates.`);
    }
    // ── Events / stats pipeline ────────────────────────────────────────────
    // Collect all match IDs that are live or done (from either source).
    const liveOrDoneMatches = rapidMatches.filter((m) => m.status.started && !m.status.cancelled);
    // All IDs to process for goal scorers / match events / stats
    const allLiveDoneIds = new Set();
    for (const m of liveOrDoneMatches) {
        const hNorm = normalise(m.home.longName || m.home.name);
        const aNorm = normalise(m.away.longName || m.away.name);
        let mid = teamPairIndex.get(`${hNorm}|${aNorm}`);
        if (!mid) {
            const apiKickoff = m.status.utcTime ? new Date(m.status.utcTime).toISOString().slice(0, 16) : null;
            if (apiKickoff)
                mid = kickoffIndex.get(apiKickoff);
        }
        if (mid && matchToEspnEvent.has(mid))
            allLiveDoneIds.add(mid);
    }
    for (const mid of espnOnlyLiveDoneIds) {
        if (matchToEspnEvent.has(mid))
            allLiveDoneIds.add(mid);
    }
    if (allLiveDoneIds.size === 0)
        return;
    await Promise.allSettled([...allLiveDoneIds].map(async (matchId) => {
        var _a, _b, _c, _d, _e, _f;
        if (!matchId)
            return;
        const espnEvent = matchToEspnEvent.get(matchId);
        if (!espnEvent)
            return;
        // Derive home/away names and codes directly from ESPN data
        const espnHomeComp = (_b = (_a = espnEvent.competitions) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.competitors.find((c) => c.homeAway === 'home');
        const espnAwayComp = (_d = (_c = espnEvent.competitions) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.competitors.find((c) => c.homeAway === 'away');
        if (!espnHomeComp || !espnAwayComp)
            return;
        const espnHomeNorm = normalise(espnHomeComp.team.displayName);
        const espnAwayNorm = normalise(espnAwayComp.team.displayName);
        const homeCode = (_e = TEAM_NAME_TO_CODE[espnHomeNorm]) !== null && _e !== void 0 ? _e : espnHomeNorm.slice(0, 3).toUpperCase();
        const awayCode = (_f = TEAM_NAME_TO_CODE[espnAwayNorm]) !== null && _f !== void 0 ? _f : espnAwayNorm.slice(0, 3).toUpperCase();
        try {
            const summaryRes = await (0, node_fetch_1.default)(`${ESPN_WC_SUMMARY}?event=${espnEvent.id}`);
            if (!summaryRes.ok)
                return;
            const summary = await summaryRes.json();
            const scorers = extractEspnScorers(summary, homeCode, awayCode, espnHomeNorm, espnAwayNorm);
            // Repeat name once per goal — calcPoints awards 2pts × goals for multi-goal scorers
            const homeScorers = scorers
                .filter((s) => s.teamCode === homeCode)
                .flatMap((s) => Array(s.goals).fill(s.player));
            const awayScorers = scorers
                .filter((s) => s.teamCode === awayCode)
                .flatMap((s) => Array(s.goals).fill(s.player));
            // Use espnHomeNorm (from ESPN's own data) so extractMatchEvents /
            // extractMatchStats can find the home team in the boxscore without
            // relying on RapidAPI's potentially different spelling.
            const matchEvents = extractMatchEvents(summary, espnHomeNorm);
            const matchStats = extractMatchStats(summary, espnHomeNorm);
            await db.collection('matches').doc(matchId).set(Object.assign({ goalScorerEvents: scorers, homeScorers,
                awayScorers,
                matchEvents }, (matchStats ? { matchStats } : {})), { merge: true });
            if (scorers.length > 0) {
                console.log(`  Goal scorers ${matchId}: ` +
                    scorers.map((s) => `${s.player}(${s.teamCode})×${s.goals}`).join(', '));
            }
        }
        catch (err) {
            console.warn(`ESPN summary failed for ${matchId} (espnId=${espnEvent.id}):`, err);
        }
    }));
});
//# sourceMappingURL=index.js.map