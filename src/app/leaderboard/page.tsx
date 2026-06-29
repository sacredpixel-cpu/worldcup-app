'use client';

import { useMemo, useState, useEffect } from 'react';
import { useAuthStore, usePredictionsStore } from '@/store';
import { useMatchesStore } from '@/store/slices/matchesSlice';
import { subscribeToUserProfiles, type UserProfile } from '@/lib/usersService';
import { subscribeToCommunityPredictions } from '@/lib/predictionsService';
import type { Prediction } from '@/types/prediction';
import type { Match } from '@/types/match';
import { ALL_MATCHES } from '@/data/matches';
import { calcPoints } from '@/lib/utils/calcPoints';
import { calcGroupPoints } from '@/lib/utils/calcGroupPoints';
import { SCORING } from '@/lib/constants/scoring';
import { ClientOnly } from '@/components/ui/ClientOnly';
import Image from 'next/image';
import Link from 'next/link';

interface LeaderboardEntry {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  totalPoints: number;
  correctScores: number;
  correctOutcomes: number;
  country?: string;
  countryCode?: string;
}

// ─── Last-match prediction modal ─────────────────────────────────────────────

const normName = (n: string) =>
  n.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

function UserPredictionModal({
  entry, match, pred, profile, onClose,
}: {
  entry: LeaderboardEntry;
  match: Match;
  pred: Prediction | undefined;
  profile?: UserProfile;
  onClose: () => void;
}) {
  const avatarUrl = profile?.avatarUrl ?? entry.avatarUrl;

  const breakdown = useMemo(() => {
    if (!pred || match.homeScore == null || match.awayScore == null) return null;
    const items: { label: string; pts: number; correct: boolean; placeholder?: boolean }[] = [];

    const predOut = Math.sign(pred.homeScore - pred.awayScore);
    const actOut  = Math.sign(match.homeScore - match.awayScore);
    const correctOutcome = predOut === actOut;
    items.push({ label: 'Correct result', pts: correctOutcome ? SCORING.CORRECT_OUTCOME : 0, correct: correctOutcome });

    const correctHome = pred.homeScore === match.homeScore;
    const correctAway = pred.awayScore === match.awayScore;
    items.push({ label: `${match.homeTeam.name} exact score`, pts: correctHome ? SCORING.CORRECT_SCORE_PER_TEAM : 0, correct: correctHome });
    items.push({ label: `${match.awayTeam.name} exact score`, pts: correctAway ? SCORING.CORRECT_SCORE_PER_TEAM : 0, correct: correctAway });

    const allScorers = [...(match.homeScorers ?? []), ...(match.awayScorers ?? [])];
    const scorerGoals = new Map<string, number>();
    for (const s of allScorers) {
      const k = normName(s);
      scorerGoals.set(k, (scorerGoals.get(k) ?? 0) + 1);
    }

    const scorerPicks = [...(pred.homeScorerPicks ?? []), ...(pred.awayScorerPicks ?? [])];
    if (scorerPicks.length === 0) {
      items.push({ label: 'No scorer picks made', pts: 0, correct: false, placeholder: true });
    } else {
      for (const pick of scorerPicks) {
        const goals = scorerGoals.get(normName(pick)) ?? 0;
        items.push({ label: pick, pts: goals > 0 ? goals * SCORING.CORRECT_SCORER : SCORING.WRONG_SCORER, correct: goals > 0 });
      }
    }

    return items;
  }, [pred, match]);

  const total = breakdown?.reduce((s, i) => s + i.pts, 0) ?? 0;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/60" onClick={onClose} />
      <div
        className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl"
        style={{ background: '#0A1128', borderTop: '1px solid rgba(255,255,255,0.08)', maxHeight: '85vh', overflowY: 'auto' }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-2.5 pb-1">
          <div className="h-1 w-10 rounded-full" style={{ background: 'rgba(255,255,255,0.15)' }} />
        </div>

        {/* User header */}
        <div className="flex items-center justify-between px-4 pt-1 pb-3">
          <div className="flex items-center gap-2">
            {avatarUrl ? (
              <Image src={avatarUrl} alt={entry.displayName} width={28} height={28} className="rounded-full object-cover" unoptimized />
            ) : (
              <div className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold" style={{ background: '#FF1F8E', color: '#06091A' }}>
                {entry.displayName[0].toUpperCase()}
              </div>
            )}
            <span className="text-sm font-semibold" style={{ color: '#E8F0FF' }}>{entry.displayName}</span>
          </div>
          <button onClick={onClose} className="p-1.5 text-lg leading-none" style={{ color: '#7A91BB' }}>✕</button>
        </div>

        {/* Match header */}
        <div className="mx-4 mb-3 rounded-xl px-4 py-3" style={{ background: '#0E1535', border: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="text-center text-[10px] font-semibold mb-2 tracking-widest" style={{ color: '#7A91BB' }}>LAST MATCH</p>
          <div className="flex items-center justify-center gap-4">
            <div className="flex flex-col items-center gap-1 w-16">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={match.homeTeam.flagUrl} alt={match.homeTeam.name} className="h-6 w-9 rounded-sm object-cover" />
              <span className="text-xs font-bold" style={{ color: '#C8D8F0' }}>{match.homeTeam.code}</span>
            </div>
            <div className="text-center">
              <p className="text-3xl font-black leading-none" style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#E8F0FF' }}>
                {match.homeScore} – {match.awayScore}
              </p>
              <p className="text-[10px] mt-0.5" style={{ color: '#7A91BB' }}>FINAL</p>
            </div>
            <div className="flex flex-col items-center gap-1 w-16">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={match.awayTeam.flagUrl} alt={match.awayTeam.name} className="h-6 w-9 rounded-sm object-cover" />
              <span className="text-xs font-bold" style={{ color: '#C8D8F0' }}>{match.awayTeam.code}</span>
            </div>
          </div>
        </div>

        {!pred ? (
          <div className="mx-4 mb-6 rounded-xl py-8 text-center" style={{ background: '#0E1535', border: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-2xl mb-1">🤐</p>
            <p className="text-sm" style={{ color: '#7A91BB' }}>No prediction made for this match</p>
          </div>
        ) : (
          <div className="mx-4 mb-6 flex flex-col gap-2">
            {/* Predicted score */}
            <div className="flex items-center justify-between rounded-xl px-4 py-2.5" style={{ background: '#0E1535', border: '1px solid rgba(255,255,255,0.06)' }}>
              <span className="text-sm" style={{ color: '#7A91BB' }}>Their prediction</span>
              <span className="text-xl font-black" style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#E8F0FF' }}>
                {pred.homeScore} – {pred.awayScore}
              </span>
            </div>

            {/* Breakdown rows */}
            {breakdown && (
              <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
                {breakdown.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between px-4 py-2.5"
                    style={{
                      background: i % 2 === 0 ? '#0E1535' : 'rgba(255,255,255,0.02)',
                      borderBottom: i < breakdown.length - 1 ? '1px solid rgba(255,255,255,0.04)' : undefined,
                    }}
                  >
                    <div className="flex items-center gap-2">
                      {!item.placeholder && <span className="text-sm">{item.correct ? '✅' : '❌'}</span>}
                      <span className="text-sm" style={{ color: item.placeholder ? '#5A6E94' : item.correct ? '#C8D8F0' : '#7A91BB' }}>{item.label}</span>
                    </div>
                    {!item.placeholder && (
                      <span
                        className="text-sm font-bold"
                        style={{ color: item.pts > 0 ? '#FFB020' : item.pts < 0 ? '#FF6B6B' : '#5A6E94' }}
                      >
                        {item.pts > 0 ? `+${item.pts}` : item.pts} pts
                      </span>
                    )}
                  </div>
                ))}

                {/* Total */}
                <div
                  className="flex items-center justify-between px-4 py-3"
                  style={{ background: total > 0 ? 'rgba(255,176,32,0.08)' : 'rgba(255,255,255,0.03)', borderTop: '1px solid rgba(255,255,255,0.08)' }}
                >
                  <span className="text-sm font-bold" style={{ color: '#E8F0FF' }}>Match total</span>
                  <span
                    className="text-2xl font-black"
                    style={{ fontFamily: 'var(--font-barlow-condensed)', color: total > 0 ? '#FFB020' : '#5A6E94' }}
                  >
                    {total > 0 ? `+${total}` : total} pts
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-xl">🥇</span>;
  if (rank === 2) return <span className="text-xl">🥈</span>;
  if (rank === 3) return <span className="text-xl">🥉</span>;
  return <span className="w-8 text-center text-sm font-bold" style={{ color: '#7A91BB' }}>{rank}</span>;
}

function LeaderboardRow({ entry, rank, isMe, profile, onClick }: { entry: LeaderboardEntry; rank: number; isMe: boolean; profile?: UserProfile; onClick?: () => void }) {
  const location = profile?.countryCode
    ? `${profile.countryCode === 'us' && profile.state ? profile.state + ', ' : ''}${profile.country}`
    : null;
  // Prefer the latest avatar from Firestore over the snapshot in the entry
  const avatarUrl = profile?.avatarUrl ?? entry.avatarUrl;

  return (
    <div
      className="flex items-center gap-3 rounded-xl px-4 py-3 cursor-pointer active:opacity-75 transition-opacity"
      onClick={onClick}
      style={isMe
        ? { border: '1px solid rgba(255,31,142,0.3)', background: 'rgba(255,31,142,0.08)' }
        : { background: '#0E1535', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      <RankBadge rank={rank} />
      {avatarUrl ? (
        <Image src={avatarUrl} alt={entry.displayName} width={36} height={36} className="rounded-full object-cover" unoptimized />
      ) : (
        <div className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold" style={{ background: '#FF1F8E', color: '#06091A' }}>
          {entry.displayName[0].toUpperCase()}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-semibold" style={{ color: isMe ? '#FF4DA8' : '#C8D8F0' }}>
          {entry.displayName} {isMe && '(You)'}
        </p>
        {location ? (
          <div className="flex items-center gap-1 mt-0.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`https://flagcdn.com/w20/${profile!.countryCode}.png`} alt="" className="h-3 w-4 object-cover rounded-sm" />
            <span className="text-xs truncate" style={{ color: '#7A91BB' }}>{location}</span>
          </div>
        ) : entry.countryCode ? (
          <div className="flex items-center gap-1 mt-0.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`https://flagcdn.com/w20/${entry.countryCode}.png`} alt="" className="h-3 w-4 object-cover rounded-sm" />
            <span className="text-xs truncate" style={{ color: '#7A91BB' }}>{entry.country}</span>
          </div>
        ) : null}
      </div>
      <div className="text-right">
        <p className="text-lg font-black" style={{ color: '#FFB020', fontFamily: 'var(--font-barlow-condensed)' }}>{entry.totalPoints}</p>
        <p className="text-[10px]" style={{ color: '#7A91BB' }}>pts</p>
      </div>
    </div>
  );
}

// ─── Main content ─────────────────────────────────────────────────────────────

function LeaderboardContent() {
  const { user, setR32Rank } = useAuthStore();
  const { saved } = usePredictionsStore();
  const { getLiveMatch, updates } = useMatchesStore();
  const [tab, setTab] = useState<'round32' | 'global'>('round32');
  const [userProfiles, setUserProfiles] = useState<Record<string, UserProfile>>({});
  const [allPredictions, setAllPredictions] = useState<Prediction[]>([]);
  const [boardLoading, setBoardLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState<LeaderboardEntry | null>(null);

  useEffect(() => {
    const unsub = subscribeToUserProfiles(setUserProfiles);
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = subscribeToCommunityPredictions(preds => {
      setAllPredictions(preds);
      setBoardLoading(false);
    });
    return () => unsub();
  }, []);

  const userEntry = useMemo<LeaderboardEntry | null>(() => {
    if (!user) return null;
    // Use live Firestore match data (scores + scorers written by Cloud Functions)
    const finished = ALL_MATCHES.map(getLiveMatch).filter(m => m.status === 'finished' && m.homeScore !== null);
    let pts = 0, exact = 0, correct = 0;
    finished.forEach(m => {
      const p = saved[m.id];
      if (!p) return;
      const earned = calcPoints(p, {
        homeScore: m.homeScore!,
        awayScore: m.awayScore!,
        homeScorers: m.homeScorers,
        awayScorers: m.awayScorers,
      });
      pts += earned;
      if (p.homeScore === m.homeScore && p.awayScore === m.awayScore) exact++;
      if (earned > 0) correct++;
    });
    // Add group-advancement prediction points (+3 winner, +2 runner-up, +1 third)
    pts += calcGroupPoints(saved, updates).total;
    return { userId: user.id, displayName: user.displayName, avatarUrl: user.avatarUrl, totalPoints: pts, correctScores: exact, correctOutcomes: correct };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, saved, updates]);

  // Most recently completed match — used for the tap-to-preview modal.
  // Sort by kickoff time (ALL_MATCHES is ordered by group, not date).
  const lastFinishedMatch = useMemo(() => {
    const finished = ALL_MATCHES
      .map(getLiveMatch)
      .filter(m => m.status === 'finished' && m.homeScore != null)
      .sort((a, b) => new Date(a.kickoffAt).getTime() - new Date(b.kickoffAt).getTime());
    return finished.length > 0 ? finished[finished.length - 1] : null;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updates]);

  // Index all Firestore predictions by userId for quick lookup in the modal
  const predsByUserIndex = useMemo(() => {
    const idx: Record<string, Record<string, Prediction>> = {};
    for (const pred of allPredictions) {
      if (!idx[pred.userId]) idx[pred.userId] = {};
      idx[pred.userId][pred.matchId] = pred;
    }
    return idx;
  }, [allPredictions]);

  // Derive the selected user's prediction for the last finished match
  const selectedPred = useMemo(() => {
    if (!selectedEntry || !lastFinishedMatch) return undefined;
    const userPreds = selectedEntry.userId === user?.id
      ? saved
      : (predsByUserIndex[selectedEntry.userId] ?? {});
    return userPreds[lastFinishedMatch.id];
  }, [selectedEntry, lastFinishedMatch, predsByUserIndex, saved, user?.id]);

  const globalBoard = useMemo(() => {
    // Use live Firestore match data (scores + scorers written by Cloud Functions)
    const finishedMatches = ALL_MATCHES.map(getLiveMatch).filter(m => m.status === 'finished' && m.homeScore !== null);

    // Group all Firestore predictions by userId → matchId
    const predsByUser: Record<string, Record<string, Prediction>> = {};
    for (const pred of allPredictions) {
      if (!predsByUser[pred.userId]) predsByUser[pred.userId] = {};
      predsByUser[pred.userId][pred.matchId] = pred;
    }

    // Build one entry per real user profile
    const rawEntries: (LeaderboardEntry & { email?: string })[] = Object.values(userProfiles).map(profile => {
      // Use live Zustand-derived entry for the current user (most up-to-date)
      if (user && profile.userId === user.id && userEntry) {
        return { ...userEntry, email: profile.email, country: profile.country, countryCode: profile.countryCode };
      }

      const preds = predsByUser[profile.userId] ?? {};
      let pts = 0, exact = 0, correct = 0;
      finishedMatches.forEach(m => {
        const p = preds[m.id];
        if (!p) return;
        const earned = calcPoints(p, {
          homeScore: m.homeScore!,
          awayScore: m.awayScore!,
          homeScorers: m.homeScorers,
          awayScorers: m.awayScorers,
        });
        pts += earned;
        if (p.homeScore === m.homeScore && p.awayScore === m.awayScore) exact++;
        if (earned > 0) correct++;
      });
      pts += calcGroupPoints(preds, updates).total;

      return {
        userId: profile.userId,
        displayName: profile.displayName ?? profile.userId,
        avatarUrl: profile.avatarUrl,
        totalPoints: pts,
        correctScores: exact,
        correctOutcomes: correct,
        email: profile.email,
        country: profile.country,
        countryCode: profile.countryCode,
      };
    });

    // If the current user has no profile yet, add their live entry
    if (user && userEntry && !userProfiles[user.id]) {
      rawEntries.push(userEntry);
    }

    // Deduplicate by email — same email = same person with multiple UIDs.
    // Keep the entry with the most points; prefer the current user's live entry.
    const byEmail = new Map<string, LeaderboardEntry & { email?: string }>();
    const noEmail: (LeaderboardEntry & { email?: string })[] = [];
    for (const entry of rawEntries) {
      if (!entry.email) { noEmail.push(entry); continue; }
      const key = entry.email.toLowerCase();
      const existing = byEmail.get(key);
      if (!existing || entry.totalPoints > existing.totalPoints ||
          (user && entry.userId === user.id)) {
        byEmail.set(key, entry);
      }
    }
    const entries: LeaderboardEntry[] = [...byEmail.values(), ...noEmail];

    // Sort: highest points first; alphabetical by displayName on tie
    return entries.sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
      return a.displayName.localeCompare(b.displayName);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userProfiles, allPredictions, user, userEntry, updates]);

  const R32_STAGE = 'round-of-32' as const;

  const r32Board = useMemo(() => {
    const r32Matches = ALL_MATCHES.filter(m => m.stage === R32_STAGE).map(getLiveMatch);
    const r32Finished = r32Matches.filter(m => m.status === 'finished' && m.homeScore !== null);

    const predsByUser: Record<string, Record<string, Prediction>> = {};
    for (const pred of allPredictions) {
      if (!predsByUser[pred.userId]) predsByUser[pred.userId] = {};
      predsByUser[pred.userId][pred.matchId] = pred;
    }

    const calcR32Pts = (preds: Record<string, Prediction>) => {
      let pts = 0, exact = 0, correct = 0;
      r32Finished.forEach(m => {
        const p = preds[m.id];
        if (!p) return;
        const earned = calcPoints(p, { homeScore: m.homeScore!, awayScore: m.awayScore!, homeScorers: m.homeScorers, awayScorers: m.awayScorers });
        pts += earned;
        if (p.homeScore === m.homeScore && p.awayScore === m.awayScore) exact++;
        if (earned > 0) correct++;
      });
      return { pts, exact, correct };
    };

    const entries: LeaderboardEntry[] = Object.values(userProfiles).map(profile => {
      const preds = (user && profile.userId === user.id) ? saved : (predsByUser[profile.userId] ?? {});
      const { pts, exact, correct } = calcR32Pts(preds);
      return { userId: profile.userId, displayName: profile.displayName ?? profile.userId, avatarUrl: profile.avatarUrl, totalPoints: pts, correctScores: exact, correctOutcomes: correct, country: profile.country, countryCode: profile.countryCode };
    });

    if (user && !userProfiles[user.id]) {
      const { pts, exact, correct } = calcR32Pts(saved);
      entries.push({ userId: user.id, displayName: user.displayName, avatarUrl: user.avatarUrl, totalPoints: pts, correctScores: exact, correctOutcomes: correct });
    }

    return entries.sort((a, b) => b.totalPoints !== a.totalPoints ? b.totalPoints - a.totalPoints : a.displayName.localeCompare(b.displayName));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userProfiles, allPredictions, user, saved, updates]);

  const r32AllDone = useMemo(
    () => ALL_MATCHES.filter(m => m.stage === R32_STAGE).map(getLiveMatch).every(m => m.status === 'finished'),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [updates],
  );

  const board = tab === 'round32' ? r32Board : globalBoard;
  const userRank = user ? board.findIndex(e => e.userId === user.id) + 1 : -1;

  // Keep r32Rank in the auth store so the brag card can show it without reloading everything
  const r32UserRank = user ? r32Board.findIndex(e => e.userId === user.id) + 1 : -1;
  useEffect(() => {
    setR32Rank(r32UserRank > 0 ? r32UserRank : null);
  }, [r32UserRank, setR32Rank]);

  return (
    <div className="flex flex-col">
      <div className="px-4 pt-4 pb-3">
        <h1 className="text-2xl font-black" style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#E8F0FF', letterSpacing: '0.02em' }}>LEADERBOARD</h1>
      </div>

      {/* Tab selector */}
      <div className="no-scrollbar flex gap-1 overflow-x-auto px-4 pb-3">
        {([
          { id: 'round32' as const, label: 'Round 32', isNew: true },
          { id: 'global'  as const, label: 'Top Fans' },
        ]).map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="no-press-ring flex-shrink-0 whitespace-nowrap"
            style={tab === t.id
              ? { display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, padding: '6px 14px', borderRadius: 20, background: 'rgba(255,31,142,0.12)', border: '1px solid rgba(255,31,142,0.35)', color: '#FF4DA8', cursor: 'pointer' }
              : { display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, padding: '6px 14px', borderRadius: 20, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#7A91BB', cursor: 'pointer' }}
          >
            {t.label}
            {t.isNew && (
              <span style={{
                fontSize: 9, fontWeight: 800, letterSpacing: '0.08em',
                background: tab === t.id ? 'rgba(255,31,142,0.25)' : 'rgba(255,176,32,0.2)',
                color: tab === t.id ? '#FF4DA8' : '#FFB020',
                border: `1px solid ${tab === t.id ? 'rgba(255,31,142,0.4)' : 'rgba(255,176,32,0.35)'}`,
                borderRadius: 4, padding: '1px 5px',
              }}>NEW</span>
            )}
          </button>
        ))}
      </div>

      {/* Round 32 info banner */}
      {tab === 'round32' && (
        <a
          href="https://inchastudios.com"
          style={{
            margin: '0 16px 12px', borderRadius: 12, padding: '10px 14px',
            background: 'rgba(255,176,32,0.06)', border: '1px solid rgba(255,176,32,0.2)',
            display: 'flex', alignItems: 'center', gap: 8,
            textDecoration: 'none', cursor: 'pointer',
          }}
        >
          <span style={{ fontSize: 16, flexShrink: 0 }}>🏆</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#FFB020' }}>
              Round of 32 Leaderboard
              {r32AllDone && <span style={{ marginLeft: 6, fontSize: 9, fontWeight: 800, letterSpacing: '0.08em', background: 'rgba(0,196,79,0.15)', color: '#00C44F', border: '1px solid rgba(0,196,79,0.3)', borderRadius: 4, padding: '1px 5px', verticalAlign: 'middle' }}>FINAL</span>}
            </p>
            <p style={{ margin: 0, fontSize: 11, color: '#7A91BB', marginTop: 2, lineHeight: 1.4 }}>
              Fresh start — only Round of 32 predictions count here. Top 2 win{' '}
              <span style={{ color: '#778DA9', textDecoration: 'underline', fontWeight: 600 }}>inchastudios.com</span>
              {' '}gear.
            </p>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/inchalogo.png" alt="InchaStudios" style={{ width: 40, height: 34, objectFit: 'contain', filter: 'invert(1) brightness(0.7)', flexShrink: 0, marginLeft: 4 }} />
        </a>
      )}

      {/* Your rank summary */}
      {user && userRank > 0 && (
        <div className="mx-4 mb-3 flex items-center justify-between rounded-xl px-4 py-2.5" style={{ background: 'rgba(255,31,142,0.08)', border: '1px solid rgba(255,31,142,0.2)' }}>
          <span className="text-sm" style={{ color: '#7A91BB' }}>Your rank</span>
          <span className="text-2xl font-black" style={{ color: '#FF4DA8', fontFamily: 'var(--font-barlow-condensed)' }}>#{userRank}</span>
          <span className="text-sm font-semibold" style={{ color: '#FFB020' }}>{board.find(e => e.userId === user?.id)?.totalPoints ?? 0} pts</span>
        </div>
      )}

      {!user && (
        <div className="mx-4 mb-3 rounded-xl px-4 py-4 text-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <p className="text-sm mb-2" style={{ color: '#7A91BB' }}>Sign in to appear on the leaderboard</p>
          <Link href="/auth/register" className="text-sm hover:underline" style={{ color: '#FF4DA8' }}>Create an account →</Link>
        </div>
      )}

      {/* Board */}
      {boardLoading ? (
        <div className="flex flex-col gap-2 px-4 pb-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl" style={{ background: '#0E1535' }} />
          ))}
        </div>
      ) : board.length === 0 ? (
        <div className="flex flex-col items-center py-14 px-4 text-center">
          <div className="mb-3 text-4xl">🏆</div>
          <p className="text-sm font-semibold" style={{ color: '#E8F0FF' }}>No fans yet</p>
          <p className="text-xs mt-1" style={{ color: '#7A91BB' }}>Be the first to make predictions and claim the top spot</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2 px-4 pb-4">
          {board.slice(0, 50).map((entry, i) => (
            <LeaderboardRow
              key={entry.userId}
              entry={entry}
              rank={i + 1}
              isMe={entry.userId === user?.id}
              profile={userProfiles[entry.userId]}
              onClick={lastFinishedMatch ? () => setSelectedEntry(entry) : undefined}
            />
          ))}
        </div>
      )}
      {selectedEntry && lastFinishedMatch && (
        <UserPredictionModal
          entry={selectedEntry}
          match={lastFinishedMatch}
          pred={selectedPred}
          profile={userProfiles[selectedEntry.userId]}
          onClose={() => setSelectedEntry(null)}
        />
      )}
    </div>
  );
}

export default function LeaderboardPage() {
  return (
    <ClientOnly fallback={<div className="flex flex-col gap-3 p-4">{[...Array(8)].map((_, i) => <div key={i} className="h-16 animate-pulse rounded-xl" style={{ background: '#0E1535' }} />)}</div>}>
      <LeaderboardContent />
    </ClientOnly>
  );
}
