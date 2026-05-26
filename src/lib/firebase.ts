import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getMessaging, isSupported } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyB_bqubbQVKORTWT3SCgOxepo7Lss_PPoo",
  authDomain: "worldcup-2026-43ab4.firebaseapp.com",
  projectId: "worldcup-2026-43ab4",
  storageBucket: "worldcup-2026-43ab4.firebasestorage.app",
  messagingSenderId: "541778389034",
  appId: "1:541778389034:web:f31f81976eac934a28fb53",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const storage = getStorage(app);

// FCM only runs in the browser and only in supported environments
// (Chrome/Edge on desktop; Chrome on Android; Safari 16.4+ as installed PWA on iOS)
export async function getMessagingInstance() {
  if (typeof window === 'undefined') return null;
  const supported = await isSupported();
  if (!supported) return null;
  return getMessaging(app);
}
