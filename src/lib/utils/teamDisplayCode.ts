// Broadcast-style 3-letter codes for the 32 qualified nations.
// Overrides FIFA country codes where they differ (e.g. DEU→GER, NLD→NED, ZAF→RSA).
const CODES: Record<string, string> = {
  'Algeria':                'ALG',
  'Argentina':              'ARG',
  'Australia':              'AUS',
  'Austria':                'AUT',
  'Belgium':                'BEL',
  'Bosnia & Herzegovina':   'BIH',
  'Brazil':                 'BRA',
  'Canada':                 'CAN',
  "Côte d'Ivoire":          'CIV',
  'Colombia':               'COL',
  'Cape Verde':             'CPV',
  'Croatia':                'CRO',
  'DR Congo':               'COD',
  'Ecuador':                'ECU',
  'Egypt':                  'EGY',
  'England':                'ENG',
  'Spain':                  'ESP',
  'France':                 'FRA',
  'Germany':                'GER',
  'Ghana':                  'GHA',
  'Japan':                  'JPN',
  'Morocco':                'MAR',
  'Mexico':                 'MEX',
  'Netherlands':            'NED',
  'Norway':                 'NOR',
  'Paraguay':               'PAR',
  'Portugal':               'POR',
  'South Africa':           'RSA',
  'Senegal':                'SEN',
  'Switzerland':            'SUI',
  'Sweden':                 'SWE',
  'United States':          'USA',
};

/** Returns the 3-letter broadcast code for a team, falling back to the raw name. */
export function teamDisplayCode(name: string): string {
  return CODES[name] ?? name;
}
