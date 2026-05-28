import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc,
  query, where, arrayUnion, onSnapshot, type Unsubscribe,
} from 'firebase/firestore';
import type { Group, GroupMember } from '@/types/group';
import { db } from './firebase';

const GROUPS = 'groups';

export async function createGroupInFirestore(group: Group): Promise<void> {
  await setDoc(doc(db, GROUPS, group.id), group);
}

export async function getGroupByInviteCode(inviteCode: string): Promise<Group | null> {
  const q = query(collection(db, GROUPS), where('inviteCode', '==', inviteCode.toUpperCase()));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return snap.docs[0].data() as Group;
}

export async function addMemberToGroup(groupId: string, member: GroupMember): Promise<void> {
  await updateDoc(doc(db, GROUPS, groupId), {
    members: arrayUnion(member),
  });
}

export async function getAllGroups(): Promise<Group[]> {
  const snap = await getDocs(collection(db, GROUPS));
  return snap.docs.map(d => d.data() as Group);
}

export async function getUserGroups(userId: string): Promise<Group[]> {
  const snap = await getDocs(collection(db, GROUPS));
  return snap.docs
    .map(d => d.data() as Group)
    .filter(g => g.members.some(m => m.userId === userId));
}

export async function removeMemberFromGroup(groupId: string, userId: string): Promise<void> {
  const ref = doc(db, GROUPS, groupId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const group = snap.data() as Group;
  const updatedMembers = group.members.filter(m => m.userId !== userId);
  await updateDoc(ref, { members: updatedMembers });
}

export function subscribeToUserGroups(userId: string, cb: (groups: Group[]) => void): Unsubscribe {
  return onSnapshot(collection(db, GROUPS), (snap) => {
    const groups = snap.docs
      .map(d => d.data() as Group)
      .filter(g => g.members.some(m => m.userId === userId));
    cb(groups);
  });
}
