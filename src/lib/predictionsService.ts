import {
  doc, setDoc, getDoc, getDocs, collection, query, where, onSnapshot, type Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Prediction } from '@/types/prediction';

const PREDICTIONS = 'predictions';

export async function savePredictionToFirestore(prediction: Prediction): Promise<void> {
  const id = `${prediction.userId}_${prediction.matchId}`;
  await setDoc(doc(db, PREDICTIONS, id), prediction);
}

export async function saveAllPredictionsToFirestore(predictions: Prediction[]): Promise<void> {
  await Promise.all(predictions.map(savePredictionToFirestore));
}

export async function getPrediction(userId: string, matchId: string): Promise<Prediction | null> {
  const snap = await getDoc(doc(db, PREDICTIONS, `${userId}_${matchId}`));
  return snap.exists() ? (snap.data() as Prediction) : null;
}

export async function getUserPredictions(userId: string): Promise<Prediction[]> {
  const q = query(collection(db, PREDICTIONS), where('userId', '==', userId));
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as Prediction);
}

export async function getAllPredictions(): Promise<Prediction[]> {
  const snap = await getDocs(collection(db, PREDICTIONS));
  return snap.docs.map(d => d.data() as Prediction);
}

export function subscribeToCommunityPredictions(cb: (predictions: Prediction[]) => void): Unsubscribe {
  return onSnapshot(collection(db, PREDICTIONS), (snap) => {
    cb(snap.docs.map(d => d.data() as Prediction));
  });
}
