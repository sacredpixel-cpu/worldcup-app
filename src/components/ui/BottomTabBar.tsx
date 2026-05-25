'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ClientOnly } from './ClientOnly';

const TABS = [
  {
    href: '/schedule',
    label: 'Schedule',
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.8} className="h-6 w-6">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    href: '/predictions',
    label: 'My Picks',
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.8} className="h-6 w-6">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v4l3 3" />
      </svg>
    ),
  },
  {
    href: '/leaderboard',
    label: 'Standings',
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.8} className="h-6 w-6">
        <path d="M8 21H16M12 17V21M7 17H17L19 7H5L7 17Z" />
        <path d="M12 3C13.1 3 14 3.9 14 5C14 6.1 13.1 7 12 7C10.9 7 10 6.1 10 5C10 3.9 10.9 3 12 3Z" />
      </svg>
    ),
  },
  {
    href: '/groups',
    label: 'Groups',
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.8} className="h-6 w-6">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
  },
  {
    href: '/profile',
    label: 'Profile',
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.8} className="h-6 w-6">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
        <circle cx="12" cy="7" r="4" />
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
