'use client';

import Image from 'next/image';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function FirstPredictionModal({ open, onClose }: Props) {
  if (!open) return null;

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-[300] flex items-end justify-center px-4 pb-8"
      style={{ background: 'rgba(6,9,26,0.88)' }}
      onClick={onClose}
    >
      {/* Card */}
      <div
        className="w-full max-w-[430px] rounded-2xl overflow-hidden flex flex-col items-center text-center"
        style={{
          background: 'linear-gradient(160deg, #0E1535 0%, #0A1128 100%)',
          border: '1px solid rgba(255,176,32,0.25)',
          boxShadow: '0 16px 48px rgba(0,0,0,0.7)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Trophy image — black bg blends seamlessly */}
        <div className="relative w-full" style={{ background: '#000', height: 220 }}>
          <Image
            src="/wc-trophy.png"
            alt="FIFA World Cup Trophy"
            fill
            className="object-contain"
            style={{ objectPosition: 'center 10%' }}
          />
          {/* Gold glow underneath */}
          <div
            className="absolute bottom-0 left-0 right-0 h-16"
            style={{ background: 'linear-gradient(to top, #0A1128, transparent)' }}
          />
        </div>

        {/* Text + CTA */}
        <div className="px-6 pb-6 pt-2 flex flex-col items-center gap-4">
          <div className="flex flex-col gap-2">
            <h2 className="text-xl font-black" style={{ color: '#E8F0FF' }}>
              Nice pick! Don&rsquo;t stop there.
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: '#9AAED4' }}>
              The tournament moves fast. Keep predicting matches before they kick off — every correct score, result, and goal scorer adds to your total.
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-full rounded-xl py-3.5 text-sm font-bold"
            style={{ background: '#FF1F8E', color: '#06091A' }}
          >
            Let's go! 🔥
          </button>
        </div>
      </div>
    </div>
  );
}
