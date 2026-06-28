import type { Team } from '@/types/match';

// ISO alpha-2 codes for flagcdn.com
export const FLAG_CDN: Record<string, string> = {
  // Group A
  MEX: 'mx', ZAF: 'za', KOR: 'kr', CZE: 'cz',
  // Group B
  CAN: 'ca', BIH: 'ba', QAT: 'qa', CHE: 'ch',
  // Group C
  BRA: 'br', MAR: 'ma', HAI: 'ht', SCO: 'gb-sct',
  // Group D
  USA: 'us', PRY: 'py', AUS: 'au', TUR: 'tr',
  // Group E
  DEU: 'de', CUW: 'cw', CIV: 'ci', ECU: 'ec',
  // Group F
  NLD: 'nl', JPN: 'jp', SWE: 'se', TUN: 'tn',
  // Group G
  BEL: 'be', EGY: 'eg', IRN: 'ir', NZL: 'nz',
  // Group H
  ESP: 'es', CPV: 'cv', SAU: 'sa', URU: 'uy',
  // Group I
  FRA: 'fr', SEN: 'sn', IRQ: 'iq', NOR: 'no',
  // Group J
  ARG: 'ar', DZA: 'dz', AUT: 'at', JOR: 'jo',
  // Group K
  PRT: 'pt', COD: 'cd', UZB: 'uz', COL: 'co',
  // Group L
  ENG: 'gb-eng', HRV: 'hr', GHA: 'gh', PAN: 'pa',
  TBD: '',
  // Historical teams (not in 2026 WC) — used by all-time scorers list
  GER: 'de', HUN: 'hu', PER: 'pe', POL: 'pl', POR: 'pt',
};

function flagUrl(code: string): string {
  const alpha2 = FLAG_CDN[code];
  if (!alpha2) return '';
  return `https://flagcdn.com/w40/${alpha2}.png`;
}

function team(id: string, name: string, code: string, group: string): Team {
  return { id, name, code, flagUrl: flagUrl(code), group };
}

// ── Group A ──
export const MEX = team('mex', 'Mexico',       'MEX', 'A');
export const ZAF = team('zaf', 'South Africa', 'ZAF', 'A');
export const KOR = team('kor', 'South Korea',  'KOR', 'A');
export const CZE = team('cze', 'Czechia',      'CZE', 'A');

// ── Group B ──
export const CAN = team('can', 'Canada',                  'CAN', 'B');
export const BIH = team('bih', 'Bosnia & Herzegovina',    'BIH', 'B');
export const QAT = team('qat', 'Qatar',                   'QAT', 'B');
export const CHE = team('che', 'Switzerland',             'CHE', 'B');

// ── Group C ──
export const BRA = team('bra', 'Brazil',   'BRA', 'C');
export const MAR = team('mar', 'Morocco',  'MAR', 'C');
export const HAI = team('hai', 'Haiti',    'HAI', 'C');
export const SCO = team('sco', 'Scotland', 'SCO', 'C');

// ── Group D ──
export const USA = team('usa', 'United States', 'USA', 'D');
export const PRY = team('pry', 'Paraguay',      'PRY', 'D');
export const AUS = team('aus', 'Australia',     'AUS', 'D');
export const TUR = team('tur', 'Türkiye',       'TUR', 'D');

// ── Group E ──
export const DEU = team('deu', 'Germany',       'DEU', 'E');
export const CUW = team('cuw', 'Curaçao',       'CUW', 'E');
export const CIV = team('civ', "Côte d'Ivoire", 'CIV', 'E');
export const ECU = team('ecu', 'Ecuador',       'ECU', 'E');

// ── Group F ──
export const NLD = team('nld', 'Netherlands', 'NLD', 'F');
export const JPN = team('jpn', 'Japan',       'JPN', 'F');
export const SWE = team('swe', 'Sweden',      'SWE', 'F');
export const TUN = team('tun', 'Tunisia',     'TUN', 'F');

// ── Group G ──
export const BEL = team('bel', 'Belgium',     'BEL', 'G');
export const EGY = team('egy', 'Egypt',       'EGY', 'G');
export const IRN = team('irn', 'Iran',        'IRN', 'G');
export const NZL = team('nzl', 'New Zealand', 'NZL', 'G');

// ── Group H ──
export const ESP = team('esp', 'Spain',       'ESP', 'H');
export const CPV = team('cpv', 'Cape Verde',  'CPV', 'H');
export const SAU = team('sau', 'Saudi Arabia','SAU', 'H');
export const URU = team('uru', 'Uruguay',     'URU', 'H');

// ── Group I ──
export const FRA = team('fra', 'France',  'FRA', 'I');
export const SEN = team('sen', 'Senegal', 'SEN', 'I');
export const IRQ = team('irq', 'Iraq',    'IRQ', 'I');
export const NOR = team('nor', 'Norway',  'NOR', 'I');

// ── Group J ──
export const ARG = team('arg', 'Argentina', 'ARG', 'J');
export const DZA = team('dza', 'Algeria',   'DZA', 'J');
export const AUT = team('aut', 'Austria',   'AUT', 'J');
export const JOR = team('jor', 'Jordan',    'JOR', 'J');

// ── Group K ──
export const PRT = team('prt', 'Portugal', 'PRT', 'K');
export const COD = team('cod', 'DR Congo', 'COD', 'K');
export const UZB = team('uzb', 'Uzbekistan','UZB', 'K');
export const COL = team('col', 'Colombia', 'COL', 'K');

// ── Group L ──
export const ENG = team('eng', 'England',  'ENG', 'L');
export const HRV = team('hrv', 'Croatia',  'HRV', 'L');
export const GHA = team('gha', 'Ghana',    'GHA', 'L');
export const PAN = team('pan', 'Panama',   'PAN', 'L');

export const TBD_TEAM: Team = { id: 'tbd', name: 'TBD', code: 'TBD', flagUrl: '', group: '' };

export const GROUPS: Record<string, Team[]> = {
  A: [MEX, ZAF, KOR, CZE],
  B: [CAN, BIH, QAT, CHE],
  C: [BRA, MAR, HAI, SCO],
  D: [USA, PRY, AUS, TUR],
  E: [DEU, CUW, CIV, ECU],
  F: [NLD, JPN, SWE, TUN],
  G: [BEL, EGY, IRN, NZL],
  H: [ESP, CPV, SAU, URU],
  I: [FRA, SEN, IRQ, NOR],
  J: [ARG, DZA, AUT, JOR],
  K: [PRT, COD, UZB, COL],
  L: [ENG, HRV, GHA, PAN],
};

export const ALL_TEAMS: Team[] = Object.values(GROUPS).flat();

export const TEAMS_BY_CODE: Record<string, Team> = Object.fromEntries(
  ALL_TEAMS.map(t => [t.code, t])
);
