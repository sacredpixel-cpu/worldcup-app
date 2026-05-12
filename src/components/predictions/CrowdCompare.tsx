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
      <div className="flex items-center justify-between text-xs text-white/40 mb-1">
        <span>Community avg: {homeAvg}–{awayAvg}</span>
        <span>{count} picks</span>
      </div>
      <div className="flex h-1.5 w-full overflow-hidden rounded-full">
        <div style={{ width: `${homeWinPct}%` }} className="bg-brand-light" title={homeTeamName} />
        <div style={{ width: `${drawPct}%` }} className="bg-white/20" title="Draw" />
        <div style={{ width: `${awayWinPct}%` }} className="bg-accent" title={awayTeamName} />
      </div>
      <div className="mt-0.5 flex justify-between text-[10px] text-white/30">
        <span>{homeWinPct}% {homeTeamName.split(' ')[0]}</span>
        <span>{drawPct}% Draw</span>
        <span>{awayWinPct}% {awayTeamName.split(' ')[0]}</span>
      </div>
    </div>
  );
}
