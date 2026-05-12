// Fetch matches, live scores, tournament schedule

import { apiClient } from '@/lib/api/client';
import type { Match } from '@/types';

export const matchService = {
  getSchedule: () => apiClient<Match[]>('/matches'),
  getMatch: (id: string) => apiClient<Match>(`/matches/${id}`),
  getLiveMatches: () => apiClient<Match[]>('/matches/live'),
};
