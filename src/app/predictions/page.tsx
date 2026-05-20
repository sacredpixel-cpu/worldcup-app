'use client';

import { useMemo, useState } from 'react';
import { useAuthStore, usePredictionsStore } from '@/store';
import { ALL_MATCHES, GROUP_STAGE_MATCHES } from '@/data/matches';
import { GROUPS } from '@/data/teams';
import { MatchCard } from '@/components/schedule/MatchCard';
import { ClientOnly } from '@/components/ui/ClientOnly';
import Link from 'next/link';
import Image from 'next/image';
import { calcGroupPoints } from '@/lib/utils/calcGroupPoints';
import type { Team } from '@/types/match';
import type { Prediction } from '@/types/prediction';

type SubTab = 'upcoming' | 'groups';

interface Standing {
  team: Team;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  pts: number;
}

function buildPredictedStandings(
  groupLetter: string,
  saved: Record<string, Prediction>
): { standings: Standing[]; complete: boolean; predictedCount: number; totalMatches: number } {
  const teams = GROUPS[groupLetter] ?? [];
  const standings: Standing[] = teams.map(team => ({
    team, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, pts: 0,
  }));
  const byId = Object.fromEntries(standings.map(s => [s.team.id, s]));

  const matches = GROUP_STAGE_MATCHES.filter(m => m.homeTeam.group === groupLetter);
  const totalMatches = matches.length;
  let predictedCount = 0;

  matches.forEach(m => {
    const pred = saved[m.id];
    if (!pred) return;
    predictedCount++;

    const home = byId[m.homeTeam.id];
    const away = byId[m.awayTeam.id];
    if (!home || !away) return;

    home.played++; away.played++;
    home.gf += pred.homeScore; home.ga += pred.awayScore;
    away.gf += pred.awayScore; away.ga += pred.homeScore;

    if (pred.homeScore > pred.awayScore) {
      home.won++; home.pts += 3; away.lost++;
    } else if (pred.homeScore < pred.awayScore) {
      away.won++; away.pts += 3; home.lost++;
    } else {
      home.drawn++; home.pts++; away.drawn++; away.pts++;
    }
  });

  standings.sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    const gdDiff = (b.gf - b.ga) - (a.gf - a.ga);
    if (gdDiff !== 0) return gdDiff;
    return b.gf - a.gf;
  });

  return { standings, complete: predictedCount === totalMatches && totalMatches > 0, predictedCount, totalMatches };
}

function TeamRow({ standing, rank, correct }: { standing: Standing; rank: number; correct?: boolean }) {
  const gd = standing.gf - standing.ga;
  const advancesAuto = rank <= 2;
  const advancesThird = rank === 3;

  return (
    <div className={`flex items-center gap-2 rounded-lg px-3 py-2 ${
      correct === true ? 'bg-accent/10 border border-accent/30' :
      correct === false ? 'bg-red-50 border border-red-200' :
      advancesAuto ? 'bg-accent/10 border border-accent/20' :
      advancesThird ? 'bg-brand/5 border border-brand/10' :
      'bg-card/40 border border-border/50'
    }`}>
      <span className={`w-5 text-center text-xs font-bold ${
        correct === true ? 'text-accent' :
        correct === false ? 'text-red-400' :
        advancesAuto ? 'text-accent' : advancesThird ? 'text-brand' : 'text-gray-400'
      }`}>{rank}</span>
      {standing.team.flagUrl && (
        <Image src={standing.team.flagUrl} alt={standing.team.name} width={20} height={14} className="rounded-sm object-cover" unoptimized />
      )}
      <span className="flex-1 text-xs font-semibold text-gray-900 truncate">{standing.team.name}</span>
      <div className="flex items-center gap-3 text-[10px] text-gray-500 font-mono">
        <span title="Played" className="w-4 text-center">{standing.played}</span>
        <span title="Pts" className="w-4 text-center font-bold text-gray-900">{standing.pts}</span>
        <span title="GD" className={`w-5 text-center ${gd > 0 ? 'text-accent' : gd < 0 ? 'text-red-400' : ''}`}>
          {gd > 0 ? '+' : ''}{gd}
        </span>
      </div>
      {correct === true && <span className="text-[10px] font-semibold text-accent">✓</span>}
      {correct === false && <span className="text-[10px] font-semibold text-red-400">✗</span>}
      {correct === undefined && advancesAuto && <span className="text-[10px] font-semibold text-accent">✓ ADV</span>}
      {correct === undefined && advancesThird && <span className="text-[10px] font-semibold text-brand">3rd</span>}
    </div>
  );
}

function GroupCard({ letter, saved, pointsResult }: {
  letter: string;
  saved: Record<string, Prediction>;
  pointsResult?: { points: number; winnerCorrect: boolean; runnerUpCorrect: boolean; thirdCorrect: boolean };
}) {
  const { standings, complete, predictedCount, totalMatches } = useMemo(
    () => buildPredictedStandings(letter, saved),
    [letter, saved]
  );

  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-black text-gray-900">Group {letter}</h3>
        <div className="flex items-center gap-2">
          {pointsResult !== undefined && (
            <span className={`text-xs font-bold ${pointsResult.points > 0 ? 'text-gold' : 'text-gray-400'}`}>
              +{pointsResult.points} pts
            </span>
          )}
          <span className="text-[10px] text-gray-400">{predictedCount}/{totalMatches} predicted</span>
        </div>
      </div>

      {complete ? (
        <div className="flex flex-col gap-1.5">
          {standings.map((s, i) => {
            const correctVal = pointsResult !== undefined
              ? (i === 0 ? pointsResult.winnerCorrect : i === 1 ? pointsResult.runnerUpCorrect : i === 2 ? pointsResult.thirdCorrect : undefined)
              : undefined;
            return <TeamRow key={s.team.id} standing={s} rank={i + 1} correct={correctVal} />;
          })}
          <p className="mt-1 text-[10px] text-gray-400 text-center">
            Based on your score predictions
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {standings.map((s, i) => (
            <div key={s.team.id} className="flex items-center gap-2 rounded-lg border border-border/50 bg-card/40 px-3 py-2 opacity-50">
              <span className="w-5 text-center text-xs font-bold text-gray-400">{i + 1}</span>
              {s.team.flagUrl && (
                <Image src={s.team.flagUrl} alt={s.team.name} width={20} height={14} className="rounded-sm object-cover" unoptimized />
              )}
              <span className="flex-1 text-xs font-semibold text-gray-900 truncate">{s.team.name}</span>
            </div>
          ))}
          <div className="mt-1 rounded-lg bg-surface px-3 py-2 text-center">
            <p className="text-[11px] text-gray-500">
              Predict more scores for this group to display its winners
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">{totalMatches - predictedCount} match{totalMatches - predictedCount !== 1 ? 'es' : ''} remaining</p>
          </div>
        </div>
      )}
    </div>
  );
}

function BestThirdSection({ saved }: { saved: Record<string, Prediction> }) {
  const { thirdPlaceTeams, groupsComplete, totalGroups } = useMemo(() => {
    const results: Array<{ groupLetter: string; standing: Standing }> = [];
    let complete = 0;

    Object.keys(GROUPS).forEach(letter => {
      const { standings, complete: groupComplete } = buildPredictedStandings(letter, saved);
      if (groupComplete) {
        complete++;
        if (standings[2]) {
          results.push({ groupLetter: letter, standing: standings[2] });
        }
      }
    });

    // Sort by Points > GD > GF
    results.sort((a, b) => {
      const sa = a.standing; const sb = b.standing;
      if (sb.pts !== sa.pts) return sb.pts - sa.pts;
      const gdDiff = (sb.gf - sb.ga) - (sa.gf - sa.ga);
      if (gdDiff !== 0) return gdDiff;
      return sb.gf - sa.gf;
    });

    return { thirdPlaceTeams: results, groupsComplete: complete, totalGroups: Object.keys(GROUPS).length };
  }, [saved]);

  const advancing = thirdPlaceTeams.slice(0, 8);

  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-black text-gray-900">🏅 Best 3rd-Place Teams</h3>
        <span className="text-[10px] text-gray-400">{groupsComplete}/{totalGroups} groups</span>
      </div>
      <p className="mb-3 text-[11px] text-gray-500">
        The 8 best 3rd-place finishers across all 12 groups advance to Round of 32.
      </p>

      {groupsComplete === 0 ? (
        <div className="rounded-lg bg-surface px-3 py-4 text-center">
          <p className="text-[11px] text-gray-500">Predict more scores for this group to display its winners</p>
          <p className="text-[10px] text-gray-400 mt-0.5">Complete all 6 matches in a group to see its 3rd-place team</p>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-1.5">
            {advancing.map((r, i) => {
              const s = r.standing;
              const gd = s.gf - s.ga;
              const willAdvance = i < 8;
              return (
                <div key={s.team.id} className={`flex items-center gap-2 rounded-lg px-3 py-2 ${
                  willAdvance ? 'bg-brand/5 border border-brand/10' : 'bg-card/40 border border-border/50 opacity-50'
                }`}>
                  <span className={`w-5 text-center text-xs font-bold ${willAdvance ? 'text-brand' : 'text-gray-400'}`}>{i + 1}</span>
                  {s.team.flagUrl && (
                    <Image src={s.team.flagUrl} alt={s.team.name} width={20} height={14} className="rounded-sm object-cover" unoptimized />
                  )}
                  <span className="flex-1 text-xs font-semibold text-gray-900 truncate">{s.team.name}</span>
                  <span className="text-[10px] text-gray-400 font-mono">Grp {r.groupLetter}</span>
                  <div className="flex items-center gap-2 text-[10px] text-gray-500 font-mono">
                    <span className="font-bold text-gray-900">{s.pts}pt</span>
                    <span className={gd > 0 ? 'text-accent' : gd < 0 ? 'text-red-400' : ''}>{gd > 0 ? '+' : ''}{gd}</span>
                  </div>
                  {willAdvance && <span className="text-[10px] font-semibold text-brand">✓ ADV</span>}
                </div>
              );
            })}
          </div>

          {groupsComplete < totalGroups && (
            <div className="mt-2 rounded-lg bg-surface px-3 py-2 text-center">
              <p className="text-[11px] text-gray-500">
                {totalGroups - groupsComplete} group{totalGroups - groupsComplete !== 1 ? 's' : ''} still need predictions —
                rankings may shift as you predict more scores
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function GroupsTab({ saved }: { saved: Record<string, Prediction> }) {
  const { results, total } = useMemo(() => calcGroupPoints(saved), [saved]);
  const resultsByGroup = Object.fromEntries(results.map(r => [r.groupLetter, r]));

  return (
    <div className="mt-4 flex flex-col gap-3 px-4">
      {total > 0 && (
        <div className="flex items-center justify-between rounded-xl bg-gold/10 border border-gold/30 px-4 py-2.5">
          <span className="text-sm text-gray-600">Group stage points earned</span>
          <span className="text-lg font-black text-gold">+{total} pts</span>
        </div>
      )}
      <p className="text-xs text-gray-500 -mb-1">
        Your predicted group standings — based on your score picks across all 6 group matches.
        <span className="text-accent font-semibold"> Green = auto-advance</span>,{' '}
        <span className="text-brand font-semibold">pink = 3rd place</span>.
      </p>
      {Object.keys(GROUPS).map(letter => (
        <GroupCard key={letter} letter={letter} saved={saved} pointsResult={resultsByGroup[letter]} />
      ))}
      <BestThirdSection saved={saved} />
    </div>
  );
}

function PredictionsContent() {
  const { user } = useAuthStore();
  const { saved } = usePredictionsStore();
  const [subTab, setSubTab] = useState<SubTab>('upcoming');

  const myMatches = useMemo(() => {
    if (!user) return [];
    return [...ALL_MATCHES.filter(m => saved[m.id])].sort((a, b) =>
      a.kickoffAt.localeCompare(b.kickoffAt)
    );
  }, [user, saved]);

  const upcoming = myMatches.filter(m => m.status === 'upcoming');
  const live = myMatches.filter(m => m.status === 'live');
  const finished = myMatches.filter(m => m.status === 'finished');

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
        <div className="mb-4 text-5xl">🎯</div>
        <h2 className="mb-2 text-xl font-bold text-gray-900">Your Picks</h2>
        <p className="mb-6 text-sm text-gray-500">Sign in to start making predictions and earn points</p>
        <Link href="/auth/register" className="rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-gray-900">
          Create Account
        </Link>
      </div>
    );
  }

  const allSaved = Object.values(saved);

  function Section({ title, matches }: { title: string; matches: typeof myMatches }) {
    if (matches.length === 0) return null;
    return (
      <div className="mb-6">
        <h2 className="mb-3 px-4 text-sm font-bold uppercase tracking-wider text-gray-400">{title}</h2>
        <div className="flex flex-col gap-3 px-4">
          {matches.map(m => (
            <MatchCard
              key={m.id}
              match={m}
              userPrediction={saved[m.id]}
              allUserPredictions={allSaved}
              isAuthenticated
              userId={user!.id}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col pb-4">
      {/* Header */}
      <div className="px-4 pt-4 pb-3">
        <h1 className="text-xl font-black text-gray-900">My Picks</h1>
        <p className="text-xs text-gray-400">{myMatches.length} prediction{myMatches.length !== 1 ? 's' : ''} made</p>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 border-b border-border px-4">
        {([
          { id: 'upcoming' as SubTab, label: 'Upcoming' },
          { id: 'groups' as SubTab, label: 'Groups' },
        ]).map(t => (
          <button
            key={t.id}
            onClick={() => setSubTab(t.id)}
            className={`flex-shrink-0 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
              subTab === t.id
                ? 'border-brand-light text-brand-light'
                : 'border-transparent text-gray-400 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Upcoming tab */}
      {subTab === 'upcoming' && (
        <div className="mt-4">
          {myMatches.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <div className="mb-4 text-5xl">🎯</div>
              <h2 className="mb-2 text-lg font-bold text-gray-900">No Picks Yet</h2>
              <p className="mb-6 text-sm text-gray-500">Head to the schedule to start predicting match scores</p>
              <Link href="/schedule" className="rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-gray-900">
                View Schedule
              </Link>
            </div>
          ) : (
            <>
              <Section title="Live" matches={live} />
              <Section title="Upcoming" matches={upcoming} />
              <Section title="Finished" matches={finished} />
            </>
          )}
        </div>
      )}

      {/* Groups tab */}
      {subTab === 'groups' && (
        <GroupsTab saved={saved} />
      )}
    </div>
  );
}

export default function PredictionsPage() {
  return (
    <ClientOnly fallback={<div className="h-64 animate-pulse" />}>
      <PredictionsContent />
    </ClientOnly>
  );
}
