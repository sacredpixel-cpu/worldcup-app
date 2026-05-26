import { Badge } from '@/components/ui/Badge';
import type { Prediction } from '@/types/prediction';
import type { Match } from '@/types/match';
import { calcPoints } from '@/lib/utils/calcPoints';

export function PointsBadge({ prediction, match }: { prediction: Prediction; match: Match }) {
  if (match.status !== 'finished' || match.homeScore === null) return null;

  const pts = calcPoints(prediction, { homeScore: match.homeScore, awayScore: match.awayScore! });

  let badge: React.ReactNode;
  if (pts === 6) {
    badge = <Badge variant="gold">🌟 Perfect! +6 pts</Badge>;
  } else if (pts === 3) {
    badge = <Badge variant="gold">⭐ +3 pts</Badge>;
  } else if (pts > 0) {
    badge = <Badge variant="green">✓ +{pts} pts</Badge>;
  } else {
    badge = <Badge variant="gray">✗ 0 pts</Badge>;
  }

  return (
    <div className="flex items-center justify-between gap-2 text-[11px]">
      <span style={{ color: '#7A91BB' }}>
        Your pick: {prediction.homeScore}–{prediction.awayScore}
      </span>
      {badge}
    </div>
  );
}
