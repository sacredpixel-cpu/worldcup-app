'use client';

/**
 * NotificationPrompt
 *
 * Appears once as a bottom banner after the user has been authenticated for
 * a short time. Handles four states:
 *  - iOS not-installed  → "Add to Home Screen" instructions
 *  - Not yet asked      → "Enable Notifications" CTA
 *  - Already granted    → nothing (hidden)
 *  - Dismissed          → hidden for 7 days
 */

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store';
import {
  isNotificationSupported,
  needsPWAInstall,
  requestAndSaveToken,
} from '@/lib/notifications';

const DISMISSED_KEY = 'wc2026_notif_dismissed_until';
const DISMISS_DAYS  = 7;

type PromptState = 'hidden' | 'pwa-required' | 'ask';

export function NotificationPrompt() {
  const { user } = useAuthStore();
  const [state, setState] = useState<PromptState>('hidden');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    if (!isNotificationSupported()) return;

    // Don't show if permission is already decided
    if (Notification.permission === 'granted' || Notification.permission === 'denied') return;

    // Don't show if the user dismissed recently
    const dismissedUntil = localStorage.getItem(DISMISSED_KEY);
    if (dismissedUntil && Date.now() < Number(dismissedUntil)) return;

    // Delay a little so it doesn't pop on every page transition
    const timer = setTimeout(() => {
      setState(needsPWAInstall() ? 'pwa-required' : 'ask');
    }, 8000); // 8 seconds after mount

    return () => clearTimeout(timer);
  }, [user]);

  function dismiss() {
    const until = Date.now() + DISMISS_DAYS * 24 * 60 * 60 * 1000;
    localStorage.setItem(DISMISSED_KEY, String(until));
    setState('hidden');
  }

  async function enable() {
    if (!user) return;
    setLoading(true);
    try {
      const token = await requestAndSaveToken(user.id);
      if (token) {
        setState('hidden');
      }
    } finally {
      setLoading(false);
      // If they denied the browser prompt, hide our banner too
      if (Notification.permission !== 'default') setState('hidden');
    }
  }

  if (state === 'hidden') return null;

  return (
    <div
      className="fixed bottom-[72px] left-1/2 z-[200] w-full max-w-[430px] -translate-x-1/2 px-3 pb-2"
      style={{ pointerEvents: 'auto' }}
    >
      <div
        className="flex items-start gap-3 rounded-2xl px-4 py-3.5"
        style={{
          background: 'linear-gradient(135deg, #12193E 0%, #0E1535 100%)',
          border: '1px solid rgba(255,31,142,0.25)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
        }}
      >
        {/* Icon */}
        <div
          className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
          style={{ background: 'rgba(255,31,142,0.12)', border: '1px solid rgba(255,31,142,0.25)' }}
        >
          <span className="text-lg">🔔</span>
        </div>

        {/* Copy */}
        <div className="flex-1 min-w-0">
          {state === 'pwa-required' ? (
            <>
              <p className="text-sm font-bold" style={{ color: '#E8F0FF' }}>
                Add to Home Screen for alerts
              </p>
              <p className="mt-0.5 text-xs leading-snug" style={{ color: '#7A91BB' }}>
                On iOS, tap the{' '}
                <span className="font-semibold" style={{ color: '#FF4DA8' }}>Share</span>
                {' '}button then{' '}
                <span className="font-semibold" style={{ color: '#FF4DA8' }}>
                  Add to Home Screen
                </span>{' '}
                to receive match notifications.
              </p>
            </>
          ) : (
            <>
              <p className="text-sm font-bold" style={{ color: '#E8F0FF' }}>
                Get notified for every match
              </p>
              <p className="mt-0.5 text-xs leading-snug" style={{ color: '#7A91BB' }}>
                We'll ping you at kickoff and when results are in.
              </p>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          {state === 'ask' && (
            <button
              onClick={enable}
              disabled={loading}
              className="whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-bold transition-opacity active:opacity-70"
              style={{ background: '#FF1F8E', color: '#06091A' }}
            >
              {loading ? '…' : 'Enable'}
            </button>
          )}
          <button
            onClick={dismiss}
            className="text-xs"
            style={{ color: '#5A6E94' }}
          >
            {state === 'pwa-required' ? 'Got it' : 'Not now'}
          </button>
        </div>
      </div>
    </div>
  );
}
