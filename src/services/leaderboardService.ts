// Global and group leaderboard fetching

import { apiClient } from '@/lib/api/client';
import type { LeaderboardEntry } from '@/types';

export const leaderboardService = {
  getGlobal: (page?: number) =>
    apiClient<LeaderboardEntry[]>(`/leaderboard?page=${page ?? 1}`),
  getForGroup: (groupId: string) =>
    apiClient<LeaderboardEntry[]>(`/leaderboard/group/${groupId}`),
};
