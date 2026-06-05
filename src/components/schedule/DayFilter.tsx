'use client';

interface DayFilterProps {
  dates: string[]; // ISO date strings (YYYY-MM-DD)
  selected: string | null;
  onChange: (date: string | null) => void;
}

export function DayFilter({ dates, selected, onChange }: DayFilterProps) {
  const fmt = (d: string) => {
    // d is already a local-date string (YYYY-MM-DD), parse as local noon to avoid any rollover
    const [y, mo, dy] = d.split('-').map(Number);
    const dt = new Date(y, mo - 1, dy, 12, 0, 0);
    return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 py-2">
      <button
        onClick={() => onChange(null)}
        className="flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors"
        style={selected === null
          ? { background: 'rgba(255,255,255,0.85)', color: '#06091A' }
          : { background: 'rgba(255,255,255,0.05)', color: '#7A91BB', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        All
      </button>
      {dates.map((d) => (
        <button
          key={d}
          onClick={() => onChange(d)}
          className="flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors"
          style={selected === d
            ? { background: 'rgba(255,255,255,0.85)', color: '#06091A' }
            : { background: 'rgba(255,255,255,0.05)', color: '#7A91BB', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          {fmt(d)}
        </button>
      ))}
    </div>
  );
}
