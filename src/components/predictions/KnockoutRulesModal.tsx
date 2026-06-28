'use client';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function KnockoutRulesModal({ open, onClose }: Props) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[300] flex items-end justify-center px-4 pb-8"
      style={{ background: 'rgba(6,9,26,0.88)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-[430px] rounded-2xl overflow-hidden flex flex-col items-center text-center"
        style={{
          background: 'linear-gradient(160deg, #0E1535 0%, #0A1128 100%)',
          border: '1px solid rgba(255,176,32,0.25)',
          boxShadow: '0 16px 48px rgba(0,0,0,0.7)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Top visual — "90'" representing regular time */}
        <div
          className="relative w-full flex flex-col items-center justify-center gap-1"
          style={{ background: '#000', height: 220 }}
        >
          {/* Subtle radial glow */}
          <div
            style={{
              position: 'absolute', inset: 0,
              background: 'radial-gradient(ellipse at 50% 60%, rgba(65,90,119,0.25) 0%, transparent 70%)',
              pointerEvents: 'none',
            }}
          />
          <span
            style={{
              fontFamily: 'var(--font-barlow-condensed), sans-serif',
              fontSize: 96, fontWeight: 900, lineHeight: 1,
              color: '#E0E1DD', letterSpacing: '-0.02em',
              position: 'relative',
            }}
          >
            90&prime;
          </span>
          <span
            style={{
              fontSize: 11, fontWeight: 700, letterSpacing: '0.16em',
              textTransform: 'uppercase', color: '#415A77',
              position: 'relative',
            }}
          >
            Regular time only
          </span>
          {/* Fade into card */}
          <div
            className="absolute bottom-0 left-0 right-0 h-16"
            style={{ background: 'linear-gradient(to top, #0A1128, transparent)' }}
          />
        </div>

        {/* Text + CTA */}
        <div className="px-6 pb-6 pt-2 flex flex-col items-center gap-4">
          <div className="flex flex-col gap-2">
            <h2 className="text-xl font-black" style={{ color: '#E8F0FF' }}>
              Penalty kicks don&rsquo;t count.
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: '#9AAED4' }}>
              Predictions are scored on the result at the end of regular time. If a match goes to extra time and teams are still level, that draw is what we use — goals scored in a penalty shootout are not counted.
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-full rounded-xl py-3.5 text-sm font-bold"
            style={{ background: '#FF1F8E', color: '#06091A' }}
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
