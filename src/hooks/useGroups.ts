import { useQuery, useMutation } from '@tanstack/react-query';
import { groupService } from '@/services/groupService';

export function useMyGroups() {
  return useQuery({ queryKey: ['myGroups'], queryFn: groupService.getMyGroups });
}

export function useGroup(id: string) {
  return useQuery({ queryKey: ['group', id], queryFn: () => groupService.getGroup(id) });
}

export function useCreateGroup() {
  return useMutation({ mutationFn: groupService.createGroup });
}

export function useJoinGroup() {
  return useMutation({ mutationFn: groupService.joinGroup });
}
