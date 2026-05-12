// Prediction submission and crowd comparison

import { useQuery, useMutation } from '@tanstack/react-query';
import { predictionService } from '@/services/predictionService';

export function useMyPredictions() {
  return useQuery({ queryKey: ['myPredictions'], queryFn: predictionService.getMyPredictions });
}

export function useCrowdAverage(matchId: string) {
  return useQuery({
    queryKey: ['crowd', matchId],
    queryFn: () => predictionService.getCrowdAverage(matchId),
  });
}

export function useSubmitPrediction() {
  return useMutation({ mutationFn: predictionService.submitPrediction });
}
