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
