import { doc, setDoc, getDoc, getDocs, collection, onSnapshot, type Unsubscribe } from 'firebase/firestore';
import { db } from './firebase';

export interface UserProfile {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  email?: string;
  country?: string;
  countryCode?: string;
  state?: string;
}

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  // Firestore rejects documents containing undefined values — strip them out
  const clean = Object.fromEntries(
    Object.entries(profile).filter(([, v]) => v !== undefined && v !== null)
  );
  await setDoc(doc(db, 'users', profile.userId), clean, { merge: true });
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, 'users', userId));
  return snap.exists() ? (snap.data() as UserProfile) : null;
}

export function subscribeToUserProfiles(cb: (profiles: Record<string, UserProfile>) => void): Unsubscribe {
  return onSnapshot(collection(db, 'users'), (snap) => {
    const profiles: Record<string, UserProfile> = {};
    snap.docs.forEach(d => { profiles[d.id] = d.data() as UserProfile; });
    cb(profiles);
  });
}
