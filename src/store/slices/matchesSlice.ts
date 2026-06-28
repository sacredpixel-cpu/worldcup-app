'use client';

import { create } from 'zustand';
import type { Match, MatchEvent, MatchStats } from '@/types/match';
import { subscribeToMatchUpdates } from '@/lib/matchesService';
import type { GoalScorerEvent } from '@/lib/matchesService';
import { TEAMS_BY_CODE } from '@/data/teams';

interface MatchUpdate {
  homeScore: number | null;
  awayScore: number | null;
  status: 'upcoming' | 'live' | 'halftime' | 'extratime' | 'penalties' | 'finished';
  homeScorers?: string[];
  awayScorers?: string[];
  goalScorerEvents?: GoalScorerEvent[];
  matchEvents?: MatchEvent[];
  matchStats?: MatchStats;
  homeTeamCode?: string;
  awayTeamCode?: string;
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

    // Derive homeScorers/awayScorers from goalScorerEvents when present.
    // goalScorerEvents stores { player, teamCode, goals } correctly (e.g. goals:2 for a brace),
    // while homeScorers may only contain one entry per player. Expanding here ensures every
    // consumer (calcPoints, MatchCard, leaderboard, profile) sees the correct goal count.
    let homeScorers = update.homeScorers;
    let awayScorers = update.awayScorers;
    if (update.goalScorerEvents && update.goalScorerEvents.length > 0) {
      const home: string[] = [];
      const away: string[] = [];
      const homeCode = update.homeTeamCode ?? match.homeTeam.code;
      for (const ev of update.goalScorerEvents) {
        const list = ev.teamCode === homeCode ? home : away;
        for (let i = 0; i < ev.goals; i++) list.push(ev.player);
      }
      if (home.length > 0) homeScorers = home;
      if (away.length > 0) awayScorers = away;
    }

    // For TBD knockout slots: swap in real teams if the poller wrote codes to Firestore
    const homeTeam = (match.homeTeam.id === 'tbd' && update.homeTeamCode)
      ? (TEAMS_BY_CODE[update.homeTeamCode] ?? match.homeTeam)
      : match.homeTeam;
    const awayTeam = (match.awayTeam.id === 'tbd' && update.awayTeamCode)
      ? (TEAMS_BY_CODE[update.awayTeamCode] ?? match.awayTeam)
      : match.awayTeam;

    return {
      ...match,
      homeTeam,
      awayTeam,
      homeScore: update.homeScore,
      awayScore: update.awayScore,
      status: update.status,
      homeScorers,
      awayScorers,
      goalScorerEvents: update.goalScorerEvents,
      matchEvents: update.matchEvents,
      matchStats: update.matchStats,
    };
  },
}));
