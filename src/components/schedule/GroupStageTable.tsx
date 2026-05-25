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
          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', background: '#0E1535' }}>
            <th className="py-2 pl-3 text-left font-medium" style={{ color: '#7A91BB' }}>Team</th>
            <th className="px-2 py-2 text-center font-medium" style={{ color: '#7A91BB' }}>P</th>
            <th className="px-2 py-2 text-center font-medium" style={{ color: '#7A91BB' }}>W</th>
            <th className="px-2 py-2 text-center font-medium" style={{ color: '#7A91BB' }}>D</th>
            <th className="px-2 py-2 text-center font-medium" style={{ color: '#7A91BB' }}>L</th>
            <th className="px-2 py-2 text-center font-medium" style={{ color: '#7A91BB' }}>GD</th>
            <th className="px-2 py-2 pr-3 text-center font-bold" style={{ color: '#5A6E94' }}>Pts</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((s, i) => (
            <tr key={s.team.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: i < 2 ? 'rgba(255,31,142,0.05)' : 'transparent' }}>
              <td className="py-2 pl-3 font-medium" style={{ color: '#E8F0FF' }}>
                <span className="mr-1.5 text-[10px]" style={{ color: i < 2 ? '#FF4DA8' : '#5A6E94' }}>{i + 1}</span>
                {s.team.name}
              </td>
              <td className="px-2 py-2 text-center" style={{ color: '#7A91BB' }}>{s.played}</td>
              <td className="px-2 py-2 text-center" style={{ color: '#7A91BB' }}>{s.won}</td>
              <td className="px-2 py-2 text-center" style={{ color: '#7A91BB' }}>{s.drawn}</td>
              <td className="px-2 py-2 text-center" style={{ color: '#7A91BB' }}>{s.lost}</td>
              <td className="px-2 py-2 text-center" style={{ color: '#7A91BB' }}>{s.gf - s.ga > 0 ? '+' : ''}{s.gf - s.ga}</td>
              <td className="px-2 py-2 pr-3 text-center font-bold" style={{ color: '#E8F0FF' }}>{s.pts}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
