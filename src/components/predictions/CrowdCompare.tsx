interface CrowdCompareProps {
  homeAvg: number;
  awayAvg: number;
  count: number;
  homeTeamName: string;
  awayTeamName: string;
}

export function CrowdCompare({ homeAvg, awayAvg, count, homeTeamName, awayTeamName }: CrowdCompareProps) {
  const homeWinPct = homeAvg > awayAvg ? 60 : homeAvg < awayAvg ? 25 : 40;
  const awayWinPct = awayAvg > homeAvg ? 60 : awayAvg < homeAvg ? 25 : 40;
  const drawPct = 100 - homeWinPct - awayWinPct;

  return (
    <div className="mt-1">
      <div className="flex items-center justify-between text-xs mb-1" style={{ color: '#7A91BB' }}>
        <span>Community avg: {homeAvg}–{awayAvg}</span>
        <span>{count} picks</span>
      </div>
      <div className="flex h-1.5 w-full overflow-hidden rounded-full">
        <div style={{ width: `${homeWinPct}%`, background: '#FF1F8E' }} title={homeTeamName} />
        <div style={{ width: `${drawPct}%`, background: 'rgba(255,255,255,0.08)' }} title="Draw" />
        <div style={{ width: `${awayWinPct}%`, background: '#00C44F' }} title={awayTeamName} />
      </div>
      <div className="mt-0.5 flex justify-between text-[10px]" style={{ color: '#7A91BB' }}>
        <span>{homeWinPct}% {homeTeamName.split(' ')[0]}</span>
        <span>{drawPct}% Draw</span>
        <span>{awayWinPct}% {awayTeamName.split(' ')[0]}</span>
      </div>
    </div>
  );
}
