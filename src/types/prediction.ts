// User prediction types

export interface Prediction {
  id: string;
  userId: string;
  matchId: string;
  homeScore: number;
  awayScore: number;
  submittedAt: string;
  pointsEarned: number | null;
}

export interface BracketPrediction {
  id: string;
  userId: string;
  predictions: Record<string, Prediction>; // matchId → Prediction
  totalPoints: number;
}
