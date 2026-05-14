'use client';

interface DayFilterProps {
  dates: string[]; // ISO date strings (YYYY-MM-DD)
  selected: string | null;
  onChange: (date: string | null) => void;
}

export function DayFilter({ dates, selected, onChange }: DayFilterProps) {
  const fmt = (d: string) => {
    const dt = new Date(d + 'T12:00:00Z');
    return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
  };

  return (
    <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 py-2">
      <button
        onClick={() => onChange(null)}
        className={`flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
          selected === null ? 'bg-brand text-gray-900' : 'bg-card text-gray-500 hover:text-white'
        }`}
      >
        All
      </button>
      {dates.map((d) => (
        <button
          key={d}
          onClick={() => onChange(d)}
          className={`flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
            selected === d ? 'bg-brand text-gray-900' : 'bg-card text-gray-500 hover:text-white'
          }`}
        >
          {fmt(d)}
        </button>
      ))}
    </div>
  );
}
