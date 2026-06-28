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
          className="relative w-full flex flex-col justify-center gap-2"
          style={{ background: '#000', height: 160 }}
        >
          {/* Subtle radial glow */}
          <div
            style={{
              position: 'absolute', inset: 0,
              background: 'radial-gradient(ellipse at 50% 60%, rgba(65,90,119,0.25) 0%, transparent 70%)',
              pointerEvents: 'none',
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'center', position: 'relative' }}>
            <span
              style={{
                fontFamily: 'var(--font-barlow-condensed), sans-serif',
                fontSize: 96, fontWeight: 900, lineHeight: 1,
                color: '#E0E1DD',
              }}
            >
              90<span style={{ display: 'inline-block', marginRight: '-0.35em' }}>&prime;</span>
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', position: 'relative' }}>
            <span
              style={{
                fontSize: 11, fontWeight: 700, letterSpacing: '0.16em',
                textTransform: 'uppercase', color: '#415A77',
              }}
            >
              Knockout Round Points Rules
            </span>
          </div>
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
              In the knockout rounds, ties are settled by extra time and penalty shootouts — but your prediction is scored on the result at the end of regular time only. Goals in a shootout don&rsquo;t count.
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
