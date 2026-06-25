/**
 * Push notification helpers — client-side only.
 *
 * Flow:
 *  1. User taps "Enable Notifications"
 *  2. requestAndSaveToken() asks the browser for permission
 *  3. On grant, FCM issues a device token
 *  4. Token is written to Firestore  fcmTokens/{token}
 *  5. Cloud Functions read that collection to broadcast to all opted-in devices
 *
 * VAPID key: get it from Firebase Console →
 *   Project Settings → Cloud Messaging → Web Push certificates → Key pair
 * Then add to .env.local:  NEXT_PUBLIC_FIREBASE_VAPID_KEY=<your key>
 */

import { getToken, onMessage } from 'firebase/messaging';
import { doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db, getMessagingInstance } from './firebase';

const _RAW_VAPID = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
// Treat the placeholder value as "not set" so we don't pass garbage to getToken().
// Key must be the Web Push certificate key pair from Firebase Console →
// Project Settings → Cloud Messaging → Web Push certificates → Key pair.
const VAPID_KEY = _RAW_VAPID && _RAW_VAPID !== 'REPLACE_WITH_YOUR_VAPID_KEY'
  ? _RAW_VAPID
  : undefined;

// ─── Platform detection ──────────────────────────────────────────────────────

export function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

/** Returns true when the app is running as an installed PWA (standalone mode). */
export function isPWAInstalled(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(display-mode: standalone)').matches
    || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

/** Returns true if the browser + OS can receive web push in any form. */
export function isNotificationSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'Notification' in window && 'serviceWorker' in navigator;
}

/**
 * iOS requires the app to be installed as a PWA before web push will work.
 * Returns true when the user is on iOS but hasn't installed the app yet.
 */
export function needsPWAInstall(): boolean {
  return isIOS() && !isPWAInstalled();
}

// ─── Token management ────────────────────────────────────────────────────────

/**
 * Requests notification permission, obtains an FCM token, and saves it to
 * Firestore so the Cloud Functions can reach this device.
 *
 * Returns the token on success, null if permission was denied or unsupported.
 */
/**
 * Runs all prerequisite checks and returns a human-readable failure reason,
 * or null when everything looks fine. Used to surface problems in the UI.
 */
export async function diagnoseNotifications(): Promise<string | null> {
  if (!isNotificationSupported()) return 'Browser does not support notifications (missing Notification API or serviceWorker)';
  if (needsPWAInstall())          return 'iOS requires the app to be installed as a PWA (Add to Home Screen) first';
  if (Notification.permission === 'denied') return 'Permission was blocked — re-enable in browser/system Settings';
  const messaging = await getMessagingInstance();
  if (!messaging) return 'Firebase Messaging is not supported in this browser (try Chrome or Edge)';
  if (!VAPID_KEY) return 'VAPID key is not configured in this build';
  return null;
}

// Last error from requestAndSaveToken — readable by callers after a null return.
let _lastTokenError: string | null = null;
export function getLastTokenError(): string | null { return _lastTokenError; }

/** Waits for a service worker registration to have an active worker (max 8 s). */
async function waitForSWActive(reg: ServiceWorkerRegistration): Promise<void> {
  if (reg.active) return;
  const sw = reg.installing ?? reg.waiting;
  if (!sw) return;
  await new Promise<void>((resolve) => {
    const handler = () => {
      if ((sw as ServiceWorker).state === 'activated') {
        sw.removeEventListener('statechange', handler);
        resolve();
      }
    };
    sw.addEventListener('statechange', handler);
    setTimeout(resolve, 8000); // safety timeout — don't hang forever
  });
}

export async function requestAndSaveToken(userId: string): Promise<string | null> {
  _lastTokenError = null;

  if (!isNotificationSupported()) { _lastTokenError = 'Notification API not available in this browser'; return null; }
  if (needsPWAInstall())          { _lastTokenError = 'iOS requires Add to Home Screen first'; return null; }

  const permission = await Notification.requestPermission();
  console.log('[WC2026] Permission:', permission);
  if (permission !== 'granted') { _lastTokenError = `Permission ${permission}`; return null; }

  const messaging = await getMessagingInstance();
  console.log('[WC2026] Messaging:', messaging ? 'OK' : 'null');
  if (!messaging) { _lastTokenError = 'Firebase Messaging not supported (try Chrome or Edge)'; return null; }

  console.log('[WC2026] VAPID key:', VAPID_KEY ? VAPID_KEY.slice(0, 8) + '…' : 'MISSING');
  if (!VAPID_KEY) { _lastTokenError = 'VAPID key missing from build'; return null; }

  try {
    console.log('[WC2026] Registering SW…');
    const swReg = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    console.log('[WC2026] SW before wait — active:', swReg.active?.state, 'installing:', swReg.installing?.state, 'waiting:', swReg.waiting?.state);

    await waitForSWActive(swReg);
    console.log('[WC2026] SW after wait — active:', swReg.active?.state);

    console.log('[WC2026] Calling getToken…');
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: swReg,
    });
    console.log('[WC2026] Token:', token ? token.slice(0, 20) + '…' : 'null');

    if (token) {
      await saveToken(userId, token);
      return token;
    }
    _lastTokenError = 'getToken returned empty — VAPID key may not match Firebase push certificate';
    console.warn('[WC2026]', _lastTokenError);
    return null;
  } catch (err) {
    _lastTokenError = `getToken error: ${String(err)}`;
    console.error('[WC2026] Failed to get FCM token:', err);
    return null;
  }
}

/** Persists a token to Firestore under the top-level fcmTokens collection. */
async function saveToken(userId: string, token: string): Promise<void> {
  await setDoc(doc(db, 'fcmTokens', token), {
    token,
    userId,
    enabled: true,
    createdAt: serverTimestamp(),
    platform: isIOS() ? 'ios-pwa' : 'web',
  });
}

/** Removes a token from Firestore (called when user opts out). */
export async function removeToken(token: string): Promise<void> {
  await deleteDoc(doc(db, 'fcmTokens', token));
}

/**
 * Attaches a foreground message listener.
 * FCM only delivers a push *notification* automatically when the app is in the
 * background (handled by the service worker). When the app is open you receive
 * the raw payload here — use this to show an in-app toast instead.
 *
 * Returns an unsubscribe function.
 */
export async function onForegroundMessage(
  callback: (payload: { title?: string; body?: string; data?: Record<string, string> }) => void
): Promise<() => void> {
  const messaging = await getMessagingInstance();
  if (!messaging) return () => {};

  return onMessage(messaging, (payload) => {
    callback({
      title: payload.notification?.title,
      body:  payload.notification?.body,
      data:  payload.data as Record<string, string> | undefined,
    });
  });
}
