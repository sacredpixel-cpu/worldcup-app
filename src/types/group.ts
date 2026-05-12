// Friend group types

export interface Group {
  id: string;
  name: string;
  inviteCode: string;
  creatorId: string;
  members: GroupMember[];
  createdAt: string;
}

export interface GroupMember {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  totalPoints: number;
  rank: number;
}
