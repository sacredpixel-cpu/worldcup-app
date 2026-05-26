'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ClientOnly } from './ClientOnly';

const TABS = [
  {
    href: '/schedule',
    label: 'Predict',
    icon: (active: boolean) => (
      // Square
      <svg viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.8} className="h-6 w-6">
        <rect x="4" y="4" width="16" height="16" />
      </svg>
    ),
  },
  {
    href: '/predictions',
    label: 'Results',
    icon: (active: boolean) => (
      // Diamond
      <svg viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.8} className="h-6 w-6">
        <polygon points="12,2 22,12 12,22 2,12" />
      </svg>
    ),
  },
  {
    href: '/leaderboard',
    label: 'Standings',
    icon: (active: boolean) => (
      // Star
      <svg viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.8} className="h-6 w-6">
        <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
      </svg>
    ),
  },
  {
    href: '/groups',
    label: 'Groups',
    icon: (active: boolean) => (
      // Triangle
      <svg viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.8} className="h-6 w-6">
        <polygon points="12,3 22,21 2,21" />
      </svg>
    ),
  },
  {
    href: '/profile',
    label: 'Profile',
    icon: (active: boolean) => (
      // Circle
      <svg viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.8} className="h-6 w-6">
        <circle cx="12" cy="12" r="10" />
      </svg>
    ),
  },
];

function TabBarInner() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-1/2 z-50 w-full max-w-[430px] -translate-x-1/2 safe-bottom"
      style={{ background: 'rgba(6,9,26,0.97)', borderTop: '1px solid rgba(255,255,255,0.07)' }}
    >
      <div className="flex items-end pb-1">
        {TABS.map((tab) => {
          const active = pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex flex-1 flex-col items-center gap-0.5 pb-2 pt-1 transition-colors"
              style={{ color: active ? '#FF1F8E' : '#7A91BB' }}
            >
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full transition-all duration-200"
                style={active
                  ? { background: '#FF1F8E', color: '#06091A', marginTop: '-10px', boxShadow: '0 4px 18px rgba(255,31,142,0.45)' }
                  : { background: 'transparent', color: '#7A91BB' }
                }
              >
                {tab.icon(active)}
              </div>
              <span className="text-[10px] font-semibold" style={{ fontFamily: 'var(--font-golos-text)' }}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function BottomTabBar() {
  return (
    <ClientOnly>
      <TabBarInner />
    </ClientOnly>
  );
}
