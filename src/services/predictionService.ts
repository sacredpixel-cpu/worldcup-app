// Submit and fetch predictions

import { apiClient } from '@/lib/api/client';
import type { Prediction, BracketPrediction } from '@/types';

export const predictionService = {
  submitPrediction: (data: Omit<Prediction, 'id' | 'submittedAt' | 'pointsEarned'>) =>
    apiClient<Prediction>('/predictions', { method: 'POST', body: JSON.stringify(data) }),
  getMyPredictions: () => apiClient<Prediction[]>('/predictions/me'),
  getCrowdAverage: (matchId: string) =>
    apiClient<{ homeAvg: number; awayAvg: number }>(`/predictions/crowd/${matchId}`),
};
