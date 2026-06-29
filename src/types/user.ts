// User and auth types

export interface User {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  email: string;
  totalPoints: number;
  globalRank: number | null;
  r32Rank?: number | null;
  country?: string;     // country name e.g. "USA"
  countryCode?: string; // ISO alpha-2 e.g. "us"
  state?: string;       // US state e.g. "Texas"
}
