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
  /** Score at 90 minutes — set only for knockout matches that went to extra time / penalties.
   *  When present, this is the score used to grade predictions (not the final ET/shootout result). */
  regularTimeHomeScore?: number | null;
  regularTimeAwayScore?: number | null;
  status: 'upcoming' | 'live' | 'finished';
  homeScorers?: string[];  // actual goal scorers, set when finished
  awayScorers?: string[];
}
