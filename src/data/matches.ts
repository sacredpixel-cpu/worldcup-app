import type { Match } from '@/types/match';
import {
  MEX, ZAF, KOR, CZE,
  CAN, BIH, QAT, CHE,
  BRA, MAR, HAI, SCO,
  USA, PRY, AUS, TUR,
  DEU, CUW, CIV, ECU,
  NLD, JPN, SWE, TUN,
  BEL, EGY, IRN, NZL,
  ESP, CPV, SAU, URU,
  FRA, SEN, IRQ, NOR,
  ARG, DZA, AUT, JOR,
  PRT, COD, UZB, COL,
  ENG, HRV, GHA, PAN,
  TBD_TEAM,
} from './teams';

// All kickoff times stored as UTC. Tournament is played in EDT (UTC-4).
function m(
  id: string,
  stage: Match['stage'],
  home: Match['homeTeam'],
  away: Match['awayTeam'],
  kickoffUTC: string,
  venue: string,
  city: string,
): Match {
  return { id, stage, homeTeam: home, awayTeam: away, kickoffAt: kickoffUTC, venue, city, homeScore: null, awayScore: null, status: 'upcoming' };
}

// ─────────────────────────────────────────────────────────
// GROUP STAGE  (Jun 11 – Jun 27, 2026)
// ─────────────────────────────────────────────────────────

export const GROUP_STAGE_MATCHES: Match[] = [

  // ── Group A: Mexico, South Africa, South Korea, Czechia ──
  m('GS-A-1', 'group', MEX, ZAF, '2026-06-11T19:00:00Z', 'Estadio Azteca',           'Mexico City, Mexico'),
  m('GS-A-2', 'group', KOR, CZE, '2026-06-12T02:00:00Z', 'Estadio Akron',            'Guadalajara, Mexico'),
  m('GS-A-3', 'group', CZE, ZAF, '2026-06-18T16:00:00Z', 'Mercedes-Benz Stadium',    'Atlanta, GA'),
  m('GS-A-4', 'group', MEX, KOR, '2026-06-19T01:00:00Z', 'Estadio Akron',            'Guadalajara, Mexico'),
  m('GS-A-5', 'group', CZE, MEX, '2026-06-25T01:00:00Z', 'Estadio Azteca',           'Mexico City, Mexico'),
  m('GS-A-6', 'group', ZAF, KOR, '2026-06-25T01:00:00Z', 'Estadio BBVA',             'Monterrey, Mexico'),

  // ── Group B: Canada, Bosnia & Herzegovina, Qatar, Switzerland ──
  m('GS-B-1', 'group', CAN, BIH, '2026-06-12T19:00:00Z', 'BMO Field',                'Toronto, Canada'),
  m('GS-B-2', 'group', QAT, CHE, '2026-06-13T19:00:00Z', "Levi's Stadium",           'Santa Clara, CA'),
  m('GS-B-3', 'group', CHE, BIH, '2026-06-18T19:00:00Z', 'SoFi Stadium',             'Inglewood, CA'),
  m('GS-B-4', 'group', CAN, QAT, '2026-06-18T22:00:00Z', 'BC Place',                 'Vancouver, Canada'),
  m('GS-B-5', 'group', CHE, CAN, '2026-06-24T19:00:00Z', 'BC Place',                 'Vancouver, Canada'),
  m('GS-B-6', 'group', BIH, QAT, '2026-06-24T19:00:00Z', 'Lumen Field',              'Seattle, WA'),

  // ── Group C: Brazil, Morocco, Haiti, Scotland ──
  m('GS-C-1', 'group', BRA, MAR, '2026-06-13T22:00:00Z', 'MetLife Stadium',          'East Rutherford, NJ'),
  m('GS-C-2', 'group', HAI, SCO, '2026-06-14T01:00:00Z', 'Gillette Stadium',         'Foxborough, MA'),
  m('GS-C-3', 'group', SCO, MAR, '2026-06-19T22:00:00Z', 'Gillette Stadium',         'Foxborough, MA'),
  m('GS-C-4', 'group', BRA, HAI, '2026-06-20T01:00:00Z', 'Lincoln Financial Field',  'Philadelphia, PA'),
  m('GS-C-5', 'group', SCO, BRA, '2026-06-24T22:00:00Z', 'Hard Rock Stadium',        'Miami Gardens, FL'),
  m('GS-C-6', 'group', MAR, HAI, '2026-06-24T22:00:00Z', 'Mercedes-Benz Stadium',    'Atlanta, GA'),

  // ── Group D: United States, Paraguay, Australia, Türkiye ──
  m('GS-D-1', 'group', USA, PRY, '2026-06-13T01:00:00Z', 'SoFi Stadium',             'Inglewood, CA'),
  m('GS-D-2', 'group', AUS, TUR, '2026-06-13T04:00:00Z', 'BC Place',                 'Vancouver, Canada'),
  m('GS-D-3', 'group', USA, AUS, '2026-06-19T19:00:00Z', 'Lumen Field',              'Seattle, WA'),
  m('GS-D-4', 'group', TUR, PRY, '2026-06-19T04:00:00Z', "Levi's Stadium",           'Santa Clara, CA'),
  m('GS-D-5', 'group', TUR, USA, '2026-06-26T02:00:00Z', 'SoFi Stadium',             'Inglewood, CA'),
  m('GS-D-6', 'group', PRY, AUS, '2026-06-26T02:00:00Z', "Levi's Stadium",           'Santa Clara, CA'),

  // ── Group E: Germany, Curaçao, Côte d'Ivoire, Ecuador ──
  m('GS-E-1', 'group', DEU, CUW, '2026-06-14T17:00:00Z', 'NRG Stadium',              'Houston, TX'),
  m('GS-E-2', 'group', CIV, ECU, '2026-06-14T23:00:00Z', 'Lincoln Financial Field',  'Philadelphia, PA'),
  m('GS-E-3', 'group', DEU, CIV, '2026-06-20T20:00:00Z', 'BMO Field',                'Toronto, Canada'),
  m('GS-E-4', 'group', ECU, CUW, '2026-06-21T00:00:00Z', 'Arrowhead Stadium',        'Kansas City, MO'),
  m('GS-E-5', 'group', ECU, DEU, '2026-06-25T20:00:00Z', 'MetLife Stadium',          'East Rutherford, NJ'),
  m('GS-E-6', 'group', CUW, CIV, '2026-06-25T20:00:00Z', 'Lincoln Financial Field',  'Philadelphia, PA'),

  // ── Group F: Netherlands, Japan, Sweden, Tunisia ──
  m('GS-F-1', 'group', NLD, JPN, '2026-06-14T20:00:00Z', 'AT&T Stadium',             'Arlington, TX'),
  m('GS-F-2', 'group', SWE, TUN, '2026-06-15T02:00:00Z', 'Estadio BBVA',             'Monterrey, Mexico'),
  m('GS-F-3', 'group', NLD, SWE, '2026-06-20T17:00:00Z', 'NRG Stadium',              'Houston, TX'),
  m('GS-F-4', 'group', TUN, JPN, '2026-06-20T04:00:00Z', 'Estadio BBVA',             'Monterrey, Mexico'),
  m('GS-F-5', 'group', JPN, SWE, '2026-06-25T23:00:00Z', 'AT&T Stadium',             'Arlington, TX'),
  m('GS-F-6', 'group', TUN, NLD, '2026-06-25T23:00:00Z', 'Arrowhead Stadium',        'Kansas City, MO'),

  // ── Group G: Belgium, Egypt, Iran, New Zealand ──
  m('GS-G-1', 'group', BEL, EGY, '2026-06-15T19:00:00Z', 'Lumen Field',              'Seattle, WA'),
  m('GS-G-2', 'group', IRN, NZL, '2026-06-16T01:00:00Z', 'SoFi Stadium',             'Inglewood, CA'),
  m('GS-G-3', 'group', BEL, IRN, '2026-06-21T19:00:00Z', 'SoFi Stadium',             'Inglewood, CA'),
  m('GS-G-4', 'group', NZL, EGY, '2026-06-22T01:00:00Z', 'BC Place',                 'Vancouver, Canada'),
  m('GS-G-5', 'group', EGY, IRN, '2026-06-27T03:00:00Z', 'Lumen Field',              'Seattle, WA'),
  m('GS-G-6', 'group', NZL, BEL, '2026-06-27T03:00:00Z', 'BC Place',                 'Vancouver, Canada'),

  // ── Group H: Spain, Cape Verde, Saudi Arabia, Uruguay ──
  m('GS-H-1', 'group', ESP, CPV, '2026-06-15T16:00:00Z', 'Mercedes-Benz Stadium',    'Atlanta, GA'),
  m('GS-H-2', 'group', SAU, URU, '2026-06-15T22:00:00Z', 'Hard Rock Stadium',        'Miami Gardens, FL'),
  m('GS-H-3', 'group', ESP, SAU, '2026-06-21T16:00:00Z', 'Mercedes-Benz Stadium',    'Atlanta, GA'),
  m('GS-H-4', 'group', URU, CPV, '2026-06-21T22:00:00Z', 'Hard Rock Stadium',        'Miami Gardens, FL'),
  m('GS-H-5', 'group', CPV, SAU, '2026-06-27T00:00:00Z', 'NRG Stadium',              'Houston, TX'),
  m('GS-H-6', 'group', URU, ESP, '2026-06-27T00:00:00Z', 'Estadio Akron',            'Guadalajara, Mexico'),

  // ── Group I: France, Senegal, Iraq, Norway ──
  m('GS-I-1', 'group', FRA, SEN, '2026-06-16T19:00:00Z', 'MetLife Stadium',          'East Rutherford, NJ'),
  m('GS-I-2', 'group', IRQ, NOR, '2026-06-16T22:00:00Z', 'Gillette Stadium',         'Foxborough, MA'),
  m('GS-I-3', 'group', FRA, IRQ, '2026-06-22T21:00:00Z', 'Lincoln Financial Field',  'Philadelphia, PA'),
  m('GS-I-4', 'group', NOR, SEN, '2026-06-23T00:00:00Z', 'MetLife Stadium',          'East Rutherford, NJ'),
  m('GS-I-5', 'group', NOR, FRA, '2026-06-26T19:00:00Z', 'Gillette Stadium',         'Foxborough, MA'),
  m('GS-I-6', 'group', SEN, IRQ, '2026-06-26T19:00:00Z', 'BMO Field',                'Toronto, Canada'),

  // ── Group J: Argentina, Algeria, Austria, Jordan ──
  m('GS-J-1', 'group', AUT, JOR, '2026-06-16T04:00:00Z', "Levi's Stadium",           'Santa Clara, CA'),
  m('GS-J-2', 'group', ARG, DZA, '2026-06-17T01:00:00Z', 'Arrowhead Stadium',        'Kansas City, MO'),
  m('GS-J-3', 'group', ARG, AUT, '2026-06-22T17:00:00Z', 'AT&T Stadium',             'Arlington, TX'),
  m('GS-J-4', 'group', JOR, DZA, '2026-06-23T03:00:00Z', "Levi's Stadium",           'Santa Clara, CA'),
  m('GS-J-5', 'group', DZA, AUT, '2026-06-28T02:00:00Z', 'Arrowhead Stadium',        'Kansas City, MO'),
  m('GS-J-6', 'group', JOR, ARG, '2026-06-28T02:00:00Z', 'AT&T Stadium',             'Arlington, TX'),

  // ── Group K: Portugal, DR Congo, Uzbekistan, Colombia ──
  m('GS-K-1', 'group', PRT, COD, '2026-06-17T17:00:00Z', 'NRG Stadium',              'Houston, TX'),
  m('GS-K-2', 'group', UZB, COL, '2026-06-18T02:00:00Z', 'Estadio Azteca',           'Mexico City, Mexico'),
  m('GS-K-3', 'group', PRT, UZB, '2026-06-23T17:00:00Z', 'NRG Stadium',              'Houston, TX'),
  m('GS-K-4', 'group', COL, COD, '2026-06-24T02:00:00Z', 'Estadio Akron',            'Guadalajara, Mexico'),
  m('GS-K-5', 'group', COL, PRT, '2026-06-28T00:30:00Z', 'Hard Rock Stadium',        'Miami Gardens, FL'),
  m('GS-K-6', 'group', COD, UZB, '2026-06-28T00:30:00Z', 'Mercedes-Benz Stadium',    'Atlanta, GA'),

  // ── Group L: England, Croatia, Ghana, Panama ──
  m('GS-L-1', 'group', ENG, HRV, '2026-06-17T20:00:00Z', 'AT&T Stadium',             'Arlington, TX'),
  m('GS-L-2', 'group', GHA, PAN, '2026-06-17T23:00:00Z', 'BMO Field',                'Toronto, Canada'),
  m('GS-L-3', 'group', ENG, GHA, '2026-06-23T20:00:00Z', 'Gillette Stadium',         'Foxborough, MA'),
  m('GS-L-4', 'group', PAN, HRV, '2026-06-23T23:00:00Z', 'BMO Field',                'Toronto, Canada'),
  m('GS-L-5', 'group', PAN, ENG, '2026-06-27T21:00:00Z', 'MetLife Stadium',          'East Rutherford, NJ'),
  m('GS-L-6', 'group', HRV, GHA, '2026-06-27T21:00:00Z', 'Lincoln Financial Field',  'Philadelphia, PA'),
];

// ─────────────────────────────────────────────────────────
// KNOCKOUT ROUNDS  (Round of 32 → Final)
// ─────────────────────────────────────────────────────────

function tbd(id: string, stage: Match['stage'], kickoffUTC: string, venue: string, city: string): Match {
  return m(id, stage, TBD_TEAM, TBD_TEAM, kickoffUTC, venue, city);
}

export const KNOCKOUT_MATCHES: Match[] = [
  // Round of 32  (Jun 28 – Jul 3) — official 2026 FIFA World Cup schedule
  tbd('R32-01', 'round-of-32', '2026-06-28T22:00:00Z', 'SoFi Stadium',            'Inglewood, CA'),       // R/U A vs R/U B
  tbd('R32-02', 'round-of-32', '2026-06-29T19:00:00Z', 'Gillette Stadium',        'Foxborough, MA'),      // W E vs Best 3rd
  tbd('R32-03', 'round-of-32', '2026-06-29T21:00:00Z', 'Estadio BBVA',            'Guadalupe, Mexico'),   // W F vs R/U C
  tbd('R32-04', 'round-of-32', '2026-06-29T23:00:00Z', 'NRG Stadium',             'Houston, TX'),         // W C vs R/U F
  tbd('R32-05', 'round-of-32', '2026-06-30T19:00:00Z', 'MetLife Stadium',         'East Rutherford, NJ'), // W I vs Best 3rd
  tbd('R32-06', 'round-of-32', '2026-06-30T21:00:00Z', 'AT&T Stadium',            'Arlington, TX'),       // R/U E vs R/U I
  tbd('R32-07', 'round-of-32', '2026-06-30T23:00:00Z', 'Estadio Azteca',          'Mexico City, Mexico'), // W A vs Best 3rd
  tbd('R32-08', 'round-of-32', '2026-07-01T19:00:00Z', 'Mercedes-Benz Stadium',   'Atlanta, GA'),         // W L vs Best 3rd
  tbd('R32-09', 'round-of-32', '2026-07-01T21:00:00Z', "Levi's Stadium",          'Santa Clara, CA'),     // W D vs Best 3rd
  tbd('R32-10', 'round-of-32', '2026-07-01T23:00:00Z', 'Lumen Field',             'Seattle, WA'),         // W G vs Best 3rd
  tbd('R32-11', 'round-of-32', '2026-07-02T19:00:00Z', 'BMO Field',               'Toronto, Canada'),     // R/U K vs R/U L
  tbd('R32-12', 'round-of-32', '2026-07-02T21:00:00Z', 'SoFi Stadium',            'Inglewood, CA'),       // W H vs R/U J
  tbd('R32-13', 'round-of-32', '2026-07-02T23:00:00Z', 'BC Place',                'Vancouver, Canada'),   // W B vs Best 3rd
  tbd('R32-14', 'round-of-32', '2026-07-03T19:00:00Z', 'Hard Rock Stadium',       'Miami Gardens, FL'),   // W J vs R/U H
  tbd('R32-15', 'round-of-32', '2026-07-03T21:00:00Z', 'Arrowhead Stadium',       'Kansas City, MO'),     // W K vs Best 3rd
  tbd('R32-16', 'round-of-32', '2026-07-03T23:00:00Z', 'AT&T Stadium',            'Arlington, TX'),       // R/U D vs R/U G

  // Round of 16  (Jul 4–7)
  tbd('R16-01', 'round-of-16', '2026-07-04T19:00:00Z', 'Lincoln Financial Field', 'Philadelphia, PA'),    // W R32-02 vs W R32-05
  tbd('R16-02', 'round-of-16', '2026-07-04T23:00:00Z', 'NRG Stadium',             'Houston, TX'),         // W R32-01 vs W R32-03
  tbd('R16-03', 'round-of-16', '2026-07-05T19:00:00Z', 'MetLife Stadium',         'East Rutherford, NJ'), // W R32-04 vs W R32-06
  tbd('R16-04', 'round-of-16', '2026-07-05T23:00:00Z', 'Estadio Azteca',          'Mexico City, Mexico'), // W R32-07 vs W R32-08
  tbd('R16-05', 'round-of-16', '2026-07-06T19:00:00Z', 'AT&T Stadium',            'Arlington, TX'),       // W R32-11 vs W R32-12
  tbd('R16-06', 'round-of-16', '2026-07-06T23:00:00Z', 'Lumen Field',             'Seattle, WA'),         // W R32-09 vs W R32-10
  tbd('R16-07', 'round-of-16', '2026-07-07T19:00:00Z', 'Mercedes-Benz Stadium',   'Atlanta, GA'),         // W R32-14 vs W R32-16
  tbd('R16-08', 'round-of-16', '2026-07-07T23:00:00Z', 'BC Place',                'Vancouver, Canada'),   // W R32-13 vs W R32-15

  // Quarter-Finals  (Jul 9–11)
  tbd('QF-01', 'quarter-final', '2026-07-09T19:00:00Z', 'Gillette Stadium',       'Foxborough, MA'),      // W R16-01 vs W R16-02
  tbd('QF-02', 'quarter-final', '2026-07-10T22:00:00Z', 'SoFi Stadium',           'Inglewood, CA'),       // W R16-05 vs W R16-06
  tbd('QF-03', 'quarter-final', '2026-07-11T19:00:00Z', 'Hard Rock Stadium',      'Miami Gardens, FL'),   // W R16-03 vs W R16-04
  tbd('QF-04', 'quarter-final', '2026-07-11T23:00:00Z', 'Arrowhead Stadium',      'Kansas City, MO'),     // W R16-07 vs W R16-08

  // Semi-Finals  (Jul 14–15)
  tbd('SF-01', 'semi-final', '2026-07-14T23:00:00Z', 'AT&T Stadium',              'Arlington, TX'),       // W QF-01 vs W QF-02
  tbd('SF-02', 'semi-final', '2026-07-15T23:00:00Z', 'Mercedes-Benz Stadium',     'Atlanta, GA'),         // W QF-03 vs W QF-04

  // Third Place  (Jul 18)
  tbd('3RD', 'third-place', '2026-07-18T20:00:00Z', 'Hard Rock Stadium',          'Miami Gardens, FL'),

  // Final  (Jul 19)
  tbd('FINAL', 'final', '2026-07-19T22:00:00Z', 'MetLife Stadium',                'East Rutherford, NJ'),
];

export const ALL_MATCHES: Match[] = [...GROUP_STAGE_MATCHES, ...KNOCKOUT_MATCHES];

export const STAGE_LABELS: Record<Match['stage'], string> = {
  'group':        'Group Stage',
  'round-of-32':  'Round of 32',
  'round-of-16':  'Round of 16',
  'quarter-final':'Quarter-Finals',
  'semi-final':   'Semi-Finals',
  'third-place':  'Third Place',
  'final':        'Final',
};
