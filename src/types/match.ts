// Match, team, and tournament stage types

export type Stage =
  | 'group'
  | 'round-of-32'
  | 'round-of-16'
  | 'quarter-final'
  | 'semi-final'
  | 'third-place'
  | 'final';

export interface Team {
  id: string;
  name: string;
  code: string;        // e.g. "BRA"
  flagUrl: string;
  group: string;       // e.g. "A"
}

export interface Match {
  id: string;
  stage: Stage;
  homeTeam: Team;
  awayTeam: Team;
  kickoffAt: string;   // ISO 8601
  venue: string;
  city: string;
  homeScore: number | null;
  awayScore: number | null;
  status: 'upcoming' | 'live' | 'finished';
  homeScorers?: string[];  // actual goal scorers, set when finished
  awayScorers?: string[];
}
