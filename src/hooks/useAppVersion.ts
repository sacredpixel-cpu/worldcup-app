'use client';

import { useEffect, useState } from 'react';

const VERSION_KEY = 'wc2026_build_id';

// NEXT_PUBLIC_BUILD_ID is baked into the JS bundle at build time by next.config.js.
// Vercel sets VERCEL_GIT_COMMIT_SHA (unique per deploy); locally falls back to Date.now().
const BUILD_ID = process.env.NEXT_PUBLIC_BUILD_ID ?? '';

export function useAppVersion() {
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    if (!BUILD_ID) return;

    function check() {
      const stored = localStorage.getItem(VERSION_KEY);
      if (stored && stored !== BUILD_ID) {
        // The JS bundle has a newer build ID than what was last acknowledged
        setUpdateAvailable(true);
      } else if (!stored) {
        // First launch — just store the current build ID, no banner
        localStorage.setItem(VERSION_KEY, BUILD_ID);
      }
    }

    check();

    // Re-check whenever the user switches back to the app
    function handleVisibility() {
      if (document.visibilityState === 'visible') check();
    }
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  function applyUpdate() {
    localStorage.setItem(VERSION_KEY, BUILD_ID);
    window.location.reload();
  }

  return { updateAvailable, applyUpdate };
}
