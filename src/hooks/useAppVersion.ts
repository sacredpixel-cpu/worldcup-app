'use client';

import { useEffect, useState } from 'react';

const VERSION_KEY = 'wc2026_build_time';
// Set by the controllerchange handler before reloading so the post-reload
// version check knows the reload was SW-triggered and skips the banner.
const SW_RELOAD_KEY = 'wc2026_sw_reloaded';

async function fetchBuildTime(): Promise<string | null> {
  try {
    const res = await fetch('/version.json', { cache: 'no-store' });
    const json = await res.json();
    return String(json.buildTime ?? '');
  } catch {
    return null;
  }
}

export function useAppVersion() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [liveId, setLiveId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    async function check() {
      const id = await fetchBuildTime();
      if (!id) return;

      // We just reloaded because a new SW activated — silently accept this version,
      // no banner needed (the page already has the new code).
      if (sessionStorage.getItem(SW_RELOAD_KEY)) {
        sessionStorage.removeItem(SW_RELOAD_KEY);
        localStorage.setItem(VERSION_KEY, id);
        return;
      }

      const stored = localStorage.getItem(VERSION_KEY);
      if (!stored) {
        localStorage.setItem(VERSION_KEY, id);
      } else if (stored !== id) {
        setLiveId(id);
        setUpdateAvailable(true);
      }
    }

    check();

    // When a new service worker activates (skipWaiting fires), reload silently so
    // users get the latest HTML and JS without ever needing a manual action.
    function handleControllerChange() {
      sessionStorage.setItem(SW_RELOAD_KEY, '1');
      window.location.reload();
    }
    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

    function handleVisibility() {
      if (document.visibilityState !== 'visible') return;
      check();
      // iOS PWA does not re-check the SW script on app resume — force it explicitly
      // so that a new SW (from a recent deploy) installs and triggers controllerchange.
      navigator.serviceWorker.ready.then(reg => reg.update()).catch(() => {});
    }
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  function applyUpdate() {
    if (liveId) localStorage.setItem(VERSION_KEY, liveId);
    window.location.reload();
  }

  return { updateAvailable, applyUpdate };
}
