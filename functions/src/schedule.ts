/**
 * Static match schedule — used by Cloud Functions to resolve team names
 * and kickoff times from a matchId without querying Firestore.
 *
 * Knockout matches list kickoffAt but leave home/away as '' because
 * teams are decided dynamically; the notification falls back to a
 * generic message when names are not yet known.
 */

export interface ScheduleEntry {
  home: string;      // Full team name, or '' for TBD knockout slots
  away: string;
  kickoffAt: string; // UTC ISO string
}

export const MATCH_SCHEDULE: Record<string, ScheduleEntry> = {
  // ── Group A ──────────────────────────────────────────────────────────────
  'GS-A-1': { home: 'Mexico',       away: 'South Africa', kickoffAt: '2026-06-11T19:00:00Z' },
  'GS-A-2': { home: 'South Korea',  away: 'Czechia',      kickoffAt: '2026-06-12T02:00:00Z' },
  'GS-A-3': { home: 'Czechia',      away: 'South Africa', kickoffAt: '2026-06-18T16:00:00Z' },
  'GS-A-4': { home: 'Mexico',       away: 'South Korea',  kickoffAt: '2026-06-19T01:00:00Z' },
  'GS-A-5': { home: 'Czechia',      away: 'Mexico',       kickoffAt: '2026-06-25T01:00:00Z' },
  'GS-A-6': { home: 'South Africa', away: 'South Korea',  kickoffAt: '2026-06-25T01:00:00Z' },

  // ── Group B ──────────────────────────────────────────────────────────────
  'GS-B-1': { home: 'Canada',      away: 'Bosnia & Herzegovina', kickoffAt: '2026-06-12T19:00:00Z' },
  'GS-B-2': { home: 'Qatar',       away: 'Switzerland',          kickoffAt: '2026-06-13T19:00:00Z' },
  'GS-B-3': { home: 'Switzerland', away: 'Bosnia & Herzegovina', kickoffAt: '2026-06-18T19:00:00Z' },
  'GS-B-4': { home: 'Canada',      away: 'Qatar',                kickoffAt: '2026-06-18T22:00:00Z' },
  'GS-B-5': { home: 'Switzerland', away: 'Canada',               kickoffAt: '2026-06-24T19:00:00Z' },
  'GS-B-6': { home: 'Bosnia & Herzegovina', away: 'Qatar',       kickoffAt: '2026-06-24T19:00:00Z' },

  // ── Group C ──────────────────────────────────────────────────────────────
  'GS-C-1': { home: 'Brazil',   away: 'Morocco',  kickoffAt: '2026-06-13T22:00:00Z' },
  'GS-C-2': { home: 'Haiti',    away: 'Scotland', kickoffAt: '2026-06-14T01:00:00Z' },
  'GS-C-3': { home: 'Scotland', away: 'Morocco',  kickoffAt: '2026-06-19T22:00:00Z' },
  'GS-C-4': { home: 'Brazil',   away: 'Haiti',    kickoffAt: '2026-06-20T01:00:00Z' },
  'GS-C-5': { home: 'Scotland', away: 'Brazil',   kickoffAt: '2026-06-24T22:00:00Z' },
  'GS-C-6': { home: 'Morocco',  away: 'Haiti',    kickoffAt: '2026-06-24T22:00:00Z' },

  // ── Group D ──────────────────────────────────────────────────────────────
  'GS-D-1': { home: 'United States', away: 'Paraguay',       kickoffAt: '2026-06-13T01:00:00Z' },
  'GS-D-2': { home: 'Australia',     away: 'Türkiye',        kickoffAt: '2026-06-13T04:00:00Z' },
  'GS-D-3': { home: 'United States', away: 'Australia',      kickoffAt: '2026-06-19T19:00:00Z' },
  'GS-D-4': { home: 'Türkiye',       away: 'Paraguay',       kickoffAt: '2026-06-19T04:00:00Z' },
  'GS-D-5': { home: 'Türkiye',       away: 'United States',  kickoffAt: '2026-06-26T02:00:00Z' },
  'GS-D-6': { home: 'Paraguay',      away: 'Australia',      kickoffAt: '2026-06-26T02:00:00Z' },

  // ── Group E ──────────────────────────────────────────────────────────────
  'GS-E-1': { home: 'Germany',      away: 'Curaçao',       kickoffAt: '2026-06-14T17:00:00Z' },
  'GS-E-2': { home: "Côte d'Ivoire", away: 'Ecuador',      kickoffAt: '2026-06-14T23:00:00Z' },
  'GS-E-3': { home: 'Germany',      away: "Côte d'Ivoire", kickoffAt: '2026-06-20T20:00:00Z' },
  'GS-E-4': { home: 'Ecuador',      away: 'Curaçao',       kickoffAt: '2026-06-21T00:00:00Z' },
  'GS-E-5': { home: 'Ecuador',      away: 'Germany',       kickoffAt: '2026-06-25T20:00:00Z' },
  'GS-E-6': { home: 'Curaçao',      away: "Côte d'Ivoire", kickoffAt: '2026-06-25T20:00:00Z' },

  // ── Group F ──────────────────────────────────────────────────────────────
  'GS-F-1': { home: 'Netherlands', away: 'Japan',       kickoffAt: '2026-06-14T20:00:00Z' },
  'GS-F-2': { home: 'Sweden',      away: 'Tunisia',     kickoffAt: '2026-06-15T02:00:00Z' },
  'GS-F-3': { home: 'Netherlands', away: 'Sweden',      kickoffAt: '2026-06-20T17:00:00Z' },
  'GS-F-4': { home: 'Tunisia',     away: 'Japan',       kickoffAt: '2026-06-20T04:00:00Z' },
  'GS-F-5': { home: 'Japan',       away: 'Sweden',      kickoffAt: '2026-06-25T23:00:00Z' },
  'GS-F-6': { home: 'Tunisia',     away: 'Netherlands', kickoffAt: '2026-06-25T23:00:00Z' },

  // ── Group G ──────────────────────────────────────────────────────────────
  'GS-G-1': { home: 'Belgium',     away: 'Egypt',       kickoffAt: '2026-06-15T19:00:00Z' },
  'GS-G-2': { home: 'Iran',        away: 'New Zealand', kickoffAt: '2026-06-16T01:00:00Z' },
  'GS-G-3': { home: 'Belgium',     away: 'Iran',        kickoffAt: '2026-06-21T19:00:00Z' },
  'GS-G-4': { home: 'New Zealand', away: 'Egypt',       kickoffAt: '2026-06-22T01:00:00Z' },
  'GS-G-5': { home: 'Egypt',       away: 'Iran',        kickoffAt: '2026-06-27T03:00:00Z' },
  'GS-G-6': { home: 'New Zealand', away: 'Belgium',     kickoffAt: '2026-06-27T03:00:00Z' },

  // ── Group H ──────────────────────────────────────────────────────────────
  'GS-H-1': { home: 'Spain',        away: 'Cape Verde',   kickoffAt: '2026-06-15T16:00:00Z' },
  'GS-H-2': { home: 'Saudi Arabia', away: 'Uruguay',      kickoffAt: '2026-06-15T22:00:00Z' },
  'GS-H-3': { home: 'Spain',        away: 'Saudi Arabia', kickoffAt: '2026-06-21T16:00:00Z' },
  'GS-H-4': { home: 'Uruguay',      away: 'Cape Verde',   kickoffAt: '2026-06-21T22:00:00Z' },
  'GS-H-5': { home: 'Cape Verde',   away: 'Saudi Arabia', kickoffAt: '2026-06-27T00:00:00Z' },
  'GS-H-6': { home: 'Uruguay',      away: 'Spain',        kickoffAt: '2026-06-27T00:00:00Z' },

  // ── Group I ──────────────────────────────────────────────────────────────
  'GS-I-1': { home: 'France',   away: 'Senegal', kickoffAt: '2026-06-16T19:00:00Z' },
  'GS-I-2': { home: 'Iraq',     away: 'Norway',  kickoffAt: '2026-06-16T22:00:00Z' },
  'GS-I-3': { home: 'France',   away: 'Iraq',    kickoffAt: '2026-06-22T21:00:00Z' },
  'GS-I-4': { home: 'Norway',   away: 'Senegal', kickoffAt: '2026-06-23T00:00:00Z' },
  'GS-I-5': { home: 'Norway',   away: 'France',  kickoffAt: '2026-06-26T19:00:00Z' },
  'GS-I-6': { home: 'Senegal',  away: 'Iraq',    kickoffAt: '2026-06-26T19:00:00Z' },

  // ── Group J ──────────────────────────────────────────────────────────────
  'GS-J-1': { home: 'Austria',   away: 'Jordan',   kickoffAt: '2026-06-16T04:00:00Z' },
  'GS-J-2': { home: 'Argentina', away: 'Algeria',  kickoffAt: '2026-06-17T01:00:00Z' },
  'GS-J-3': { home: 'Argentina', away: 'Austria',  kickoffAt: '2026-06-22T17:00:00Z' },
  'GS-J-4': { home: 'Jordan',    away: 'Algeria',  kickoffAt: '2026-06-23T03:00:00Z' },
  'GS-J-5': { home: 'Algeria',   away: 'Austria',  kickoffAt: '2026-06-28T02:00:00Z' },
  'GS-J-6': { home: 'Jordan',    away: 'Argentina', kickoffAt: '2026-06-28T02:00:00Z' },

  // ── Group K ──────────────────────────────────────────────────────────────
  'GS-K-1': { home: 'Portugal',   away: 'DR Congo',   kickoffAt: '2026-06-17T17:00:00Z' },
  'GS-K-2': { home: 'Uzbekistan', away: 'Colombia',   kickoffAt: '2026-06-18T02:00:00Z' },
  'GS-K-3': { home: 'Portugal',   away: 'Uzbekistan', kickoffAt: '2026-06-23T17:00:00Z' },
  'GS-K-4': { home: 'Colombia',   away: 'DR Congo',   kickoffAt: '2026-06-24T02:00:00Z' },
  'GS-K-5': { home: 'Colombia',   away: 'Portugal',   kickoffAt: '2026-06-28T00:30:00Z' },
  'GS-K-6': { home: 'DR Congo',   away: 'Uzbekistan', kickoffAt: '2026-06-28T00:30:00Z' },

  // ── Group L ──────────────────────────────────────────────────────────────
  'GS-L-1': { home: 'England', away: 'Croatia', kickoffAt: '2026-06-17T20:00:00Z' },
  'GS-L-2': { home: 'Ghana',   away: 'Panama',  kickoffAt: '2026-06-17T23:00:00Z' },
  'GS-L-3': { home: 'England', away: 'Ghana',   kickoffAt: '2026-06-23T20:00:00Z' },
  'GS-L-4': { home: 'Panama',  away: 'Croatia', kickoffAt: '2026-06-23T23:00:00Z' },
  'GS-L-5': { home: 'Panama',  away: 'England', kickoffAt: '2026-06-27T21:00:00Z' },
  'GS-L-6': { home: 'Croatia', away: 'Ghana',   kickoffAt: '2026-06-27T21:00:00Z' },

  // ── Round of 32 (Jun 28 – Jul 3) ─────────────────────────────────────────
  'R32-01': { home: '',        away: '',        kickoffAt: '2026-06-28T22:00:00Z' },
  'R32-02': { home: '',        away: '',        kickoffAt: '2026-06-29T19:00:00Z' },
  'R32-03': { home: '',        away: '',        kickoffAt: '2026-06-29T21:00:00Z' },
  'R32-04': { home: '',        away: '',        kickoffAt: '2026-06-29T23:00:00Z' },
  'R32-05': { home: 'France',  away: 'Sweden',  kickoffAt: '2026-06-30T19:00:00Z' },
  'R32-06': { home: '',        away: '',        kickoffAt: '2026-06-30T21:00:00Z' },
  'R32-07': { home: 'Mexico',  away: 'Ecuador', kickoffAt: '2026-06-30T23:00:00Z' },
  'R32-08': { home: '',        away: '',        kickoffAt: '2026-07-01T19:00:00Z' },
  'R32-09': { home: '',        away: '',        kickoffAt: '2026-07-01T21:00:00Z' },
  'R32-10': { home: '',        away: '',        kickoffAt: '2026-07-01T23:00:00Z' },
  'R32-11': { home: '',        away: '',        kickoffAt: '2026-07-02T19:00:00Z' },
  'R32-12': { home: '',        away: '',        kickoffAt: '2026-07-02T21:00:00Z' },
  'R32-13': { home: '',        away: '',        kickoffAt: '2026-07-02T23:00:00Z' },
  'R32-14': { home: '',        away: '',        kickoffAt: '2026-07-03T19:00:00Z' },
  'R32-15': { home: '',        away: '',        kickoffAt: '2026-07-03T21:00:00Z' },
  'R32-16': { home: '',        away: '',        kickoffAt: '2026-07-03T23:00:00Z' },

  // ── Round of 16 (Jul 4–7) ─────────────────────────────────────────────────
  'R16-01': { home: '', away: '', kickoffAt: '2026-07-04T19:00:00Z' },
  'R16-02': { home: '', away: '', kickoffAt: '2026-07-04T23:00:00Z' },
  'R16-03': { home: '', away: '', kickoffAt: '2026-07-05T19:00:00Z' },
  'R16-04': { home: '', away: '', kickoffAt: '2026-07-05T23:00:00Z' },
  'R16-05': { home: '', away: '', kickoffAt: '2026-07-06T19:00:00Z' },
  'R16-06': { home: '', away: '', kickoffAt: '2026-07-06T23:00:00Z' },
  'R16-07': { home: '', away: '', kickoffAt: '2026-07-07T19:00:00Z' },
  'R16-08': { home: '', away: '', kickoffAt: '2026-07-07T23:00:00Z' },

  // ── Quarter-Finals (Jul 9–11) ─────────────────────────────────────────────
  'QF-01': { home: '', away: '', kickoffAt: '2026-07-09T19:00:00Z' },
  'QF-02': { home: '', away: '', kickoffAt: '2026-07-10T22:00:00Z' },
  'QF-03': { home: '', away: '', kickoffAt: '2026-07-11T19:00:00Z' },
  'QF-04': { home: '', away: '', kickoffAt: '2026-07-11T23:00:00Z' },

  // ── Semi-Finals (Jul 14–15) ───────────────────────────────────────────────
  'SF-01': { home: '', away: '', kickoffAt: '2026-07-14T23:00:00Z' },
  'SF-02': { home: '', away: '', kickoffAt: '2026-07-15T23:00:00Z' },

  // ── Third Place & Final ───────────────────────────────────────────────────
  '3RD':   { home: '', away: '', kickoffAt: '2026-07-18T20:00:00Z' },
  'FINAL': { home: '', away: '', kickoffAt: '2026-07-19T22:00:00Z' },
};
