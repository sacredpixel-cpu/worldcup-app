// Group CRUD and invite management

import { apiClient } from '@/lib/api/client';
import type { Group } from '@/types';

export const groupService = {
  createGroup: (name: string) =>
    apiClient<Group>('/groups', { method: 'POST', body: JSON.stringify({ name }) }),
  joinGroup: (inviteCode: string) =>
    apiClient<Group>('/groups/join', { method: 'POST', body: JSON.stringify({ inviteCode }) }),
  getMyGroups: () => apiClient<Group[]>('/groups/me'),
  getGroup: (id: string) => apiClient<Group>(`/groups/${id}`),
};
