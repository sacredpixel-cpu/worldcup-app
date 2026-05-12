'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { Group, GroupMember } from '@/types/group';

interface GroupsState {
  groups: Group[];
  createGroup: (name: string, userId: string, displayName: string, avatarUrl: string | null) => Group;
  joinGroup: (inviteCode: string, userId: string, displayName: string, avatarUrl: string | null) => Group | null;
  getGroup: (id: string) => Group | undefined;
  leaveGroup: (groupId: string, userId: string) => void;
}

function randomCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

const safeStorage = typeof window !== 'undefined'
  ? localStorage
  : { getItem: () => null, setItem: () => {}, removeItem: () => {} } as Storage;

export const useGroupsStore = create<GroupsState>()(
  persist(
    (set, get) => ({
      groups: [],

      createGroup: (name, userId, displayName, avatarUrl) => {
        const member: GroupMember = { userId, displayName, avatarUrl, totalPoints: 0, rank: 1 };
        const group: Group = {
          id: uuidv4(),
          name,
          inviteCode: randomCode(),
          creatorId: userId,
          members: [member],
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ groups: [...s.groups, group] }));
        return group;
      },

      joinGroup: (inviteCode, userId, displayName, avatarUrl) => {
        const { groups } = get();
        const group = groups.find(g => g.inviteCode === inviteCode.toUpperCase());
        if (!group) return null;
        if (group.members.some(m => m.userId === userId)) return group;
        const member: GroupMember = { userId, displayName, avatarUrl, totalPoints: 0, rank: group.members.length + 1 };
        const updated = { ...group, members: [...group.members, member] };
        set((s) => ({ groups: s.groups.map(g => g.id === group.id ? updated : g) }));
        return updated;
      },

      getGroup: (id) => get().groups.find(g => g.id === id),

      leaveGroup: (groupId, userId) => {
        set((s) => ({
          groups: s.groups.map(g =>
            g.id === groupId
              ? { ...g, members: g.members.filter(m => m.userId !== userId) }
              : g
          ).filter(g => g.members.length > 0),
        }));
      },
    }),
    {
      name: 'wc2026-groups',
      storage: createJSONStorage(() => safeStorage),
    }
  )
);
