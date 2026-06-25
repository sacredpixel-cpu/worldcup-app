// Firebase Messaging Service Worker
// Receives push notifications when the app is in the background or closed.
// The Firebase config here must match src/lib/firebase.ts — it cannot use env vars.

// Always activate this SW immediately so navigation-fetch changes take effect without waiting.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(clients.claim()));

// Intercept HTML navigation requests (page loads) and bypass the browser/iOS cache.
// Without this, iOS PWA caches the HTML file and old JS bundles keep running even after
// a new deploy — making update detection and version checks completely ineffective.
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' }).catch(() => caches.match(event.request))
    );
  }
});

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyB_bqubbQVKORTWT3SCgOxepo7Lss_PPoo',
  authDomain: 'worldcup-2026-43ab4.firebaseapp.com',
  projectId: 'worldcup-2026-43ab4',
  storageBucket: 'worldcup-2026-43ab4.firebasestorage.app',
  messagingSenderId: '541778389034',
  appId: '1:541778389034:web:f31f81976eac934a28fb53',
});

const messaging = firebase.messaging();

// Handle messages that arrive when the app is in the background
messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || 'World Cup 2026';
  const body  = payload.notification?.body  || '';
  const data  = payload.data || {};

  self.registration.showNotification(title, {
    body,
    icon:  '/mexillicious-logo.png',
    badge: '/mexillicious-logo.png',
    tag:   data.matchId || 'wc2026',
    data,
    requireInteraction: false,
    vibrate: [100, 50, 100],
  });
});

// Open / focus the correct page when the user taps the notification
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const url = event.notification.data?.url || '/schedule';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // If a tab is already open on that URL, focus it
      for (const client of windowClients) {
        if (client.url.includes(url) && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open a new tab
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});
