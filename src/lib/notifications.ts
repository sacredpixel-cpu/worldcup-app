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

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

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
export async function requestAndSaveToken(userId: string): Promise<string | null> {
  if (!isNotificationSupported()) return null;
  if (needsPWAInstall()) return null;

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return null;

  const messaging = await getMessagingInstance();
  if (!messaging) return null;

  if (!VAPID_KEY) {
    console.warn(
      '[WC2026 Notifications] NEXT_PUBLIC_FIREBASE_VAPID_KEY is not set. ' +
      'Get it from Firebase Console → Project Settings → Cloud Messaging → Web Push certificates.'
    );
    return null;
  }

  try {
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: await navigator.serviceWorker.ready,
    });

    if (token) {
      await saveToken(userId, token);
      return token;
    }
    return null;
  } catch (err) {
    console.error('[WC2026 Notifications] Failed to get FCM token:', err);
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
