import { Badge } from '@/components/ui/Badge';
import type { Prediction } from '@/types/prediction';
import type { Match } from '@/types/match';
import { calcPoints } from '@/lib/utils/calcPoints';

export function PointsBadge({ prediction, match }: { prediction: Prediction; match: Match }) {
  if (match.status !== 'finished' || match.homeScore === null) return null;
  const pts = calcPoints(prediction, { homeScore: match.homeScore, awayScore: match.awayScore! });
  if (pts === 5) return <Badge variant="gold">+5 pts ★</Badge>;
  if (pts === 3) return <Badge variant="green">+3 pts</Badge>;
  return <Badge variant="gray">0 pts</Badge>;
}
