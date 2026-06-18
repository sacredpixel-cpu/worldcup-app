'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store';
import { onForegroundMessage } from '@/lib/notifications';

interface Toast {
  id: string;
  title: string;
  body: string;
}

/**
 * Listens for FCM messages that arrive while the app is in the foreground.
 * (The service worker handles background messages automatically.)
 * Shows a temporary in-app banner at the top of the screen.
 */
export function ForegroundNotifications() {
  const { user } = useAuthStore();
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    if (!user || typeof window === 'undefined') return;
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;

    let unsub: (() => void) | undefined;

    onForegroundMessage((payload) => {
      const id = Date.now().toString();
      setToasts(prev => [
        ...prev,
        { id, title: payload.title || 'World Cup 2026', body: payload.body || '' },
      ]);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 6000);
    }).then(fn => { unsub = fn; });

    return () => { unsub?.(); };
  }, [user]);

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed top-3 left-1/2 z-[300] flex w-full max-w-[420px] -translate-x-1/2 flex-col gap-2 px-3"
      style={{ pointerEvents: 'none' }}
    >
      {toasts.map(toast => (
        <div
          key={toast.id}
          className="flex items-start gap-3 rounded-2xl px-4 py-3"
          style={{
            background: 'linear-gradient(135deg, #12193E 0%, #0E1535 100%)',
            border: '1px solid rgba(255,31,142,0.3)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            pointerEvents: 'auto',
          }}
        >
          <span className="text-xl mt-0.5">⚽</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold" style={{ color: '#E8F0FF' }}>{toast.title}</p>
            {toast.body && (
              <p className="text-xs mt-0.5" style={{ color: '#7A91BB' }}>{toast.body}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
