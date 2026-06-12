'use client';

import { create } from 'zustand';
import type { Match, MatchEvent, MatchStats } from '@/types/match';
import { subscribeToMatchUpdates } from '@/lib/matchesService';
import type { GoalScorerEvent } from '@/lib/matchesService';

interface MatchUpdate {
  homeScore: number | null;
  awayScore: number | null;
  status: 'upcoming' | 'live' | 'halftime' | 'extratime' | 'penalties' | 'finished';
  homeScorers?: string[];
  awayScorers?: string[];
  goalScorerEvents?: GoalScorerEvent[];
  matchEvents?: MatchEvent[];
  matchStats?: MatchStats;
}

interface MatchesState {
  updates: Record<string, MatchUpdate>;
  subscribeToUpdates: () => () => void;
  getLiveMatch: (match: Match) => Match;
}

export const useMatchesStore = create<MatchesState>()((set, get) => ({
  updates: {},

  subscribeToUpdates: () => {
    return subscribeToMatchUpdates((updates) => {
      set({ updates });
    });
  },

  getLiveMatch: (match: Match): Match => {
    const update = get().updates[match.id];
    if (!update) return match;
    return {
      ...match,
      homeScore: update.homeScore,
      awayScore: update.awayScore,
      status: update.status,
      homeScorers: update.homeScorers,
      awayScorers: update.awayScorers,
      goalScorerEvents: update.goalScorerEvents,
      matchEvents: update.matchEvents,
      matchStats: update.matchStats,
    };
  },
}));
