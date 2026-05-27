// User prediction types

export interface Prediction {
  id: string;
  userId: string;
  matchId: string;
  homeScore: number;
  awayScore: number;
  homeScorerPicks: string[];  // up to 2 player names from home team
  awayScorerPicks: string[];  // up to 2 player names from away team
  submittedAt: string;
  pointsEarned: number | null;
}

export interface BracketPrediction {
  id: string;
  userId: string;
  predictions: Record<string, Prediction>; // matchId → Prediction
  totalPoints: number;
}

/** Tournament-level picks (golden boot, etc.) stored per user in Firestore `tournamentPicks/{userId}` */
export interface TournamentPrediction {
  userId: string;
  goldenBootPick?: string;   // player name picked as top scorer
  submittedAt?: string;
}

/** Tournament-wide settings set by admin in Firestore `tournament/settings` */
export interface TournamentSettings {
  goldenBootWinner?: string; // name of the actual golden boot winner (set after tournament)
}
