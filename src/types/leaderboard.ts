// Leaderboard entry type

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  totalPoints: number;
  correctScores: number;
  correctOutcomes: number;
}
