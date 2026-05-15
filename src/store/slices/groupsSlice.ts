'use client';

import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Group, GroupMember } from '@/types/group';
import {
  createGroupInFirestore,
  getGroupByInviteCode,
  addMemberToGroup,
  removeMemberFromGroup,
  getUserGroups,
  subscribeToUserGroups,
} from '@/lib/groupsService';

function randomCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

interface GroupsState {
  groups: Group[];
  loading: boolean;
  setGroups: (groups: Group[]) => void;
  createGroup: (name: string, userId: string, displayName: string, avatarUrl: string | null) => Promise<Group>;
  joinGroup: (inviteCode: string, userId: string, displayName: string, avatarUrl: string | null) => Promise<Group | null>;
  getGroup: (id: string) => Group | undefined;
  leaveGroup: (groupId: string, userId: string) => Promise<void>;
  removeMember: (groupId: string, userId: string) => Promise<void>;
  fetchUserGroups: (userId: string) => Promise<void>;
  subscribeGroups: (userId: string) => () => void;
}

export const useGroupsStore = create<GroupsState>((set, get) => ({
  groups: [],
  loading: false,

  setGroups: (groups) => set({ groups }),

  createGroup: async (name, userId, displayName, avatarUrl) => {
    const member: GroupMember = { userId, displayName, avatarUrl, totalPoints: 0, rank: 1 };
    const group: Group = {
      id: uuidv4(),
      name,
      inviteCode: randomCode(),
      creatorId: userId,
      members: [member],
      createdAt: new Date().toISOString(),
    };
    await createGroupInFirestore(group);
    set((s) => ({ groups: [...s.groups.filter(g => g.id !== group.id), group] }));
    return group;
  },

  joinGroup: async (inviteCode, userId, displayName, avatarUrl) => {
    const group = await getGroupByInviteCode(inviteCode);
    if (!group) return null;
    if (group.members.some(m => m.userId === userId)) return group;
    const member: GroupMember = {
      userId, displayName, avatarUrl, totalPoints: 0, rank: group.members.length + 1,
    };
    await addMemberToGroup(group.id, member);
    const updated = { ...group, members: [...group.members, member] };
    set((s) => ({ groups: [...s.groups.filter(g => g.id !== group.id), updated] }));
    return updated;
  },

  getGroup: (id) => get().groups.find(g => g.id === id),

  leaveGroup: async (groupId, userId) => {
    await removeMemberFromGroup(groupId, userId);
    set(s => ({
      groups: s.groups
        .map(g => g.id !== groupId ? g : { ...g, members: g.members.filter(m => m.userId !== userId) })
        .filter(g => g.members.length > 0),
    }));
  },

  removeMember: async (groupId, userId) => {
    await removeMemberFromGroup(groupId, userId);
    set(s => ({
      groups: s.groups.map(g =>
        g.id !== groupId ? g : { ...g, members: g.members.filter(m => m.userId !== userId) }
      ),
    }));
  },

  fetchUserGroups: async (userId) => {
    set({ loading: true });
    const groups = await getUserGroups(userId);
    set({ groups, loading: false });
  },

  subscribeGroups: (userId) => {
    return subscribeToUserGroups(userId, (groups) => set({ groups }));
  },
}));
