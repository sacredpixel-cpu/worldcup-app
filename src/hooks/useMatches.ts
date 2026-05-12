// React Query hook for schedule and live scores

import { useQuery } from '@tanstack/react-query';
import { matchService } from '@/services/matchService';

export function useSchedule() {
  return useQuery({ queryKey: ['schedule'], queryFn: matchService.getSchedule });
}

export function useLiveMatches() {
  return useQuery({
    queryKey: ['liveMatches'],
    queryFn: matchService.getLiveMatches,
    refetchInterval: 30_000, // poll every 30s
  });
}
