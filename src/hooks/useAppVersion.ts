'use client';

import { useEffect, useState } from 'react';

const VERSION_KEY = 'wc2026_build_time';

export function useAppVersion() {
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    async function checkVersion() {
      try {
        // cache: 'no-store' forces a real network request every time
        const res = await fetch(`/version.json?t=${Date.now()}`, { cache: 'no-store' });
        if (!res.ok) return;
        const { buildTime } = await res.json();
        const stored = localStorage.getItem(VERSION_KEY);
        if (stored && stored !== String(buildTime)) {
          // A new build was deployed since this page last loaded
          setUpdateAvailable(true);
        } else {
          // First visit or version unchanged — just store it
          localStorage.setItem(VERSION_KEY, String(buildTime));
        }
      } catch {
        // Network error — silently ignore
      }
    }

    checkVersion();

    // Re-check whenever the user switches back to the tab / homescreen app
    function handleVisibility() {
      if (document.visibilityState === 'visible') checkVersion();
    }
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  function applyUpdate() {
    // Store the new version before reloading so the banner doesn't reappear
    fetch(`/version.json?t=${Date.now()}`, { cache: 'no-store' })
      .then(r => r.json())
      .then(({ buildTime }) => localStorage.setItem(VERSION_KEY, String(buildTime)))
      .catch(() => {})
      .finally(() => window.location.reload());
  }

  return { updateAvailable, applyUpdate };
}
