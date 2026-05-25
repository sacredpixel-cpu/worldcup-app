'use client';

import { BracketView } from '@/components/bracket/BracketView';

export default function BracketPage() {
  return (
    <div className="flex flex-col pb-4">
      <div className="px-4 pt-4 pb-3">
        <h1 className="text-2xl font-black" style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#E8F0FF', letterSpacing: '0.02em' }}>BRACKET</h1>
        <p className="text-xs" style={{ color: '#7A91BB' }}>Full tournament · Jun 11 – Jul 19</p>
      </div>
      <BracketView />
    </div>
  );
}
