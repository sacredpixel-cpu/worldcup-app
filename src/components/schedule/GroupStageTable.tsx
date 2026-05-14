import type { Team } from '@/types/match';

interface Standing {
  team: Team;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  pts: number;
}

interface GroupStageTableProps {
  standings: Standing[];
}

export function GroupStageTable({ standings }: GroupStageTableProps) {
  const sorted = [...standings].sort((a, b) => b.pts - a.pts || (b.gf - b.ga) - (a.gf - a.ga));

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border bg-surface">
            <th className="py-2 pl-3 text-left font-medium text-gray-400">Team</th>
            <th className="px-2 py-2 text-center font-medium text-gray-400">P</th>
            <th className="px-2 py-2 text-center font-medium text-gray-400">W</th>
            <th className="px-2 py-2 text-center font-medium text-gray-400">D</th>
            <th className="px-2 py-2 text-center font-medium text-gray-400">L</th>
            <th className="px-2 py-2 text-center font-medium text-gray-400">GD</th>
            <th className="px-2 py-2 pr-3 text-center font-bold text-gray-600">Pts</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((s, i) => (
            <tr key={s.team.id} className={`border-b border-border last:border-0 ${i < 2 ? 'bg-brand/5' : ''}`}>
              <td className="py-2 pl-3 font-medium text-gray-900">
                <span className={`mr-1.5 text-[10px] ${i < 2 ? 'text-brand-light' : 'text-gray-400'}`}>{i + 1}</span>
                {s.team.name}
              </td>
              <td className="px-2 py-2 text-center text-gray-500">{s.played}</td>
              <td className="px-2 py-2 text-center text-gray-500">{s.won}</td>
              <td className="px-2 py-2 text-center text-gray-500">{s.drawn}</td>
              <td className="px-2 py-2 text-center text-gray-500">{s.lost}</td>
              <td className="px-2 py-2 text-center text-gray-500">{s.gf - s.ga > 0 ? '+' : ''}{s.gf - s.ga}</td>
              <td className="px-2 py-2 pr-3 text-center font-bold text-gray-900">{s.pts}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
