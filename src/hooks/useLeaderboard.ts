import { useQuery } from '@tanstack/react-query';
import { leaderboardService } from '@/services/leaderboardService';

export function useGlobalLeaderboard(page = 1) {
  return useQuery({
    queryKey: ['leaderboard', 'global', page],
    queryFn: () => leaderboardService.getGlobal(page),
  });
}

export function useGroupLeaderboard(groupId: string) {
  return useQuery({
    queryKey: ['leaderboard', 'group', groupId],
    queryFn: () => leaderboardService.getForGroup(groupId),
  });
}
