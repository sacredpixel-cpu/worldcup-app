// Match, team, and tournament stage types

export interface MatchEvent {
  type: 'goal' | 'yellow-card' | 'red-card';
  player: string;
  teamSide: 'home' | 'away';
  minute: string;      // "55'" or "90'+2'"
  minuteSort: number;  // clock.value in seconds, for ordering
}

export interface MatchStats {
  homePossession: number;
  awayPossession: number;
  homeShots: number;
  awayShots: number;
  homeShotsOnTarget: number;
  awayShotsOnTarget: number;
  homeCorners: number;
  awayCorners: number;
  homeFouls: number;
  awayFouls: number;
  homeYellows: number;
  awayYellows: number;
  homeReds: number;
  awayReds: number;
  homeOffsides: number;
  awayOffsides: number;
}

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
  status: 'upcoming' | 'live' | 'halftime' | 'extratime' | 'penalties' | 'finished';
  homeScorers?: string[];  // actual goal scorers, set when finished
  awayScorers?: string[];
  /** Structured per-match goal scorer events written by the live-score poller */
  goalScorerEvents?: Array<{ player: string; teamCode: string; goals: number; penaltyGoals?: number }>;
  matchEvents?: MatchEvent[];
  matchStats?: MatchStats;
}
