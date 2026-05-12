// User and auth types

export interface User {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  email: string;
  totalPoints: number;
  globalRank: number | null;
}
