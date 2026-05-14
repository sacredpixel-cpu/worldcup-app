'use client';

import { useState, useEffect } from 'react';
import { useAuthStore, useGroupsStore } from '@/store';
import { ClientOnly } from '@/components/ui/ClientOnly';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import Link from 'next/link';
import type { Group } from '@/types/group';

function GroupCard({ group, userId }: { group: Group; userId: string }) {
  const [copied, setCopied] = useState(false);

  function copyCode() {
    navigator.clipboard.writeText(group.inviteCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const myRank = group.members.findIndex(m => m.userId === userId) + 1;

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-bold text-gray-900">{group.name}</h3>
          <p className="text-xs text-gray-400">{group.members.length} member{group.members.length !== 1 ? 's' : ''}</p>
        </div>
        {myRank > 0 && (
          <span className="text-sm font-bold text-gold">Rank #{myRank}</span>
        )}
      </div>

      <div className="flex items-center justify-between rounded-lg bg-surface px-3 py-2 mb-3">
        <div>
          <p className="text-[10px] text-gray-400 uppercase tracking-wider">Invite Code</p>
          <p className="text-lg font-black tracking-widest text-gray-900">{group.inviteCode}</p>
        </div>
        <button
          onClick={copyCode}
          className="rounded-lg bg-brand/20 px-3 py-1.5 text-xs font-semibold text-brand-light hover:bg-brand/30"
        >
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>

      <Link
        href={`/groups/${group.id}`}
        className="block w-full rounded-lg border border-border py-2 text-center text-sm font-semibold text-gray-900 hover:bg-card/50"
      >
        View Leaderboard →
      </Link>
    </div>
  );
}

function GroupsContent() {
  const { user } = useAuthStore();
  const { groups, loading, createGroup, joinGroup, subscribeGroups } = useGroupsStore();

  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const [createError, setCreateError] = useState('');
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeGroups(user.id);
    return () => unsub();
  }, [user?.id]);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
        <div className="mb-4 text-5xl">👥</div>
        <h2 className="mb-2 text-xl font-bold text-gray-900">Groups</h2>
        <p className="mb-6 text-sm text-gray-500">Sign in to create or join prediction groups with friends</p>
        <Link href="/auth/register" className="rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-gray-900">
          Create Account
        </Link>
      </div>
    );
  }

  const userId = user.id;
  const myGroups = groups.filter(g => g.members.some(m => m.userId === userId));

  async function handleCreate() {
    if (!userId) return;
    if (!newGroupName.trim()) { setCreateError('Enter a group name.'); return; }
    setCreating(true);
    try {
      await createGroup(newGroupName.trim(), userId, user.displayName, user.avatarUrl);
      setNewGroupName('');
      setShowCreate(false);
    } catch {
      setCreateError('Failed to create group. Try again.');
    } finally {
      setCreating(false);
    }
  }

  async function handleJoin() {
    if (!userId) return;
    if (!joinCode.trim()) { setJoinError('Enter an invite code.'); return; }
    setJoining(true);
    try {
      const g = await joinGroup(joinCode.trim(), userId, user.displayName, user.avatarUrl);
      if (!g) { setJoinError('Group not found. Check the code and try again.'); return; }
      setJoinCode('');
      setJoinError('');
      setShowJoin(false);
    } catch {
      setJoinError('Failed to join group. Try again.');
    } finally {
      setJoining(false);
    }
  }

  return (
    <div className="flex flex-col pb-4">
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <h1 className="text-xl font-black text-gray-900">Groups</h1>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => setShowJoin(true)}>Join</Button>
          <Button size="sm" onClick={() => setShowCreate(true)}>+ Create</Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
        </div>
      ) : myGroups.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center px-6">
          <div className="mb-3 text-4xl">🤝</div>
          <p className="text-sm text-gray-500 mb-4">No groups yet. Create one and share the code with friends!</p>
          <Button onClick={() => setShowCreate(true)}>Create a Group</Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3 px-4">
          {myGroups.map(g => (
            <GroupCard key={g.id} group={g} userId={userId} />
          ))}
        </div>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Group">
        <div className="flex flex-col gap-4">
          <Input
            label="Group Name"
            placeholder="e.g. Office Rivals"
            value={newGroupName}
            onChange={e => setNewGroupName(e.target.value)}
            error={createError}
            autoFocus
          />
          <Button onClick={handleCreate} className="w-full" loading={creating}>Create Group</Button>
        </div>
      </Modal>

      <Modal open={showJoin} onClose={() => setShowJoin(false)} title="Join Group">
        <div className="flex flex-col gap-4">
          <Input
            label="Invite Code"
            placeholder="e.g. ABC123"
            value={joinCode}
            onChange={e => { setJoinCode(e.target.value.toUpperCase()); setJoinError(''); }}
            error={joinError}
            maxLength={6}
            autoFocus
          />
          <Button onClick={handleJoin} className="w-full" loading={joining}>Join Group</Button>
        </div>
      </Modal>
    </div>
  );
}

export default function GroupsPage() {
  return (
    <ClientOnly fallback={<div className="h-64 animate-pulse" />}>
      <GroupsContent />
    </ClientOnly>
  );
}
