'use client';

import { useMemo, useState } from 'react';
import { useAuthStore, usePredictionsStore } from '@/store';
import { ALL_MATCHES, GROUP_STAGE_MATCHES, STAGE_LABELS } from '@/data/matches';
import { GROUPS } from '@/data/teams';
import { ClientOnly } from '@/components/ui/ClientOnly';
import Link from 'next/link';
import Image from 'next/image';
import { calcGroupPoints } from '@/lib/utils/calcGroupPoints';
import { calcPoints } from '@/lib/utils/calcPoints';
import { FlagImage } from '@/components/ui/FlagImage';
import { PredictionModal } from '@/components/predictions/PredictionModal';
import { useMatchesStore } from '@/store/slices/matchesSlice';
import { formatKickoff } from '@/lib/utils/formatDate';
import type { Match, Team } from '@/types/match';
import type { Prediction } from '@/types/prediction';

type SubTab = 'groups' | 'by-game';


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

function TeamRow({ standing, rank, advancesThird = false, correct }: {
  standing: Standing;
  rank: number;
  advancesThird?: boolean;
  correct?: boolean;
}) {
  const gd = standing.gf - standing.ga;
  const advancesAuto = rank <= 2;

  return (
    <div
      className="flex items-center gap-2 rounded-lg px-3 py-2"
      style={
        correct === true ? { background: 'rgba(0,196,79,0.1)', border: '1px solid rgba(0,196,79,0.3)' } :
        correct === false ? { background: 'rgba(255,77,77,0.1)', border: '1px solid rgba(255,77,77,0.2)' } :
        advancesAuto ? { background: 'rgba(0,196,79,0.08)', border: '1px solid rgba(0,196,79,0.15)' } :
        advancesThird ? { background: 'rgba(255,31,142,0.18)', border: '1px solid rgba(255,31,142,0.4)' } :
        { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }
      }>
      <span className="w-5 text-center text-xs font-bold" style={{
        color: correct === true ? '#00C44F' : correct === false ? '#FF4D4D' :
               advancesAuto ? '#00C44F' : advancesThird ? '#FF1F8E' : '#5A6E94'
      }}>{rank}</span>
      {standing.team.flagUrl && (
        <Image src={standing.team.flagUrl} alt={standing.team.name} width={20} height={14} className="rounded-sm object-cover" unoptimized />
      )}
      <span className="flex-1 text-xs font-semibold truncate" style={{ color: '#E8F0FF' }}>{standing.team.name}</span>
      <div className="flex items-center gap-3 text-[10px] font-mono" style={{ color: '#7A91BB' }}>
        <span title="Played" className="w-4 text-center">{standing.played}</span>
        <span title="Pts" className="w-4 text-center font-bold" style={{ color: '#E8F0FF' }}>{standing.pts}</span>
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

function GroupCard({ letter, saved, pointsResult, advancingThirdIds }: {
  letter: string;
  saved: Record<string, Prediction>;
  pointsResult?: { points: number; winnerCorrect: boolean; runnerUpCorrect: boolean; thirdCorrect: boolean };
  advancingThirdIds: Set<string>;
}) {
  const { standings, complete, predictedCount, totalMatches } = useMemo(
    () => buildPredictedStandings(letter, saved),
    [letter, saved]
  );

  return (
    <div className="rounded-xl p-3" style={{ background: '#0A1128', border: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-black" style={{ color: '#E8F0FF' }}>Group {letter}</h3>
        <div className="flex items-center gap-2">
          {pointsResult !== undefined && (
            <span className={`text-xs font-bold ${pointsResult.points > 0 ? 'text-gold' : ''}`} style={pointsResult.points === 0 ? { color: '#7A91BB' } : undefined}>
              +{pointsResult.points} pts
            </span>
          )}
          <span className="text-[10px]" style={{ color: '#7A91BB' }}>{predictedCount}/{totalMatches} predicted</span>
        </div>
      </div>

      {complete ? (
        <div className="flex flex-col gap-1.5">
          {standings.map((s, i) => {
            const correctVal = pointsResult !== undefined
              ? (i === 0 ? pointsResult.winnerCorrect : i === 1 ? pointsResult.runnerUpCorrect : i === 2 ? pointsResult.thirdCorrect : undefined)
              : undefined;
            // Only the rank-3 team advances if they're in the global top-8 third-place list
            const advancesThird = i === 2 && advancingThirdIds.has(s.team.id);
            return <TeamRow key={s.team.id} standing={s} rank={i + 1} advancesThird={advancesThird} correct={correctVal} />;
          })}
          <p className="mt-1 text-[10px] text-center" style={{ color: '#7A91BB' }}>
            Based on your score predictions
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {standings.map((s, i) => (
            <div key={s.team.id} className="flex items-center gap-2 rounded-lg border border-border/50 bg-card/40 px-3 py-2 opacity-50">
              <span className="w-5 text-center text-xs font-bold" style={{ color: '#5A6E94' }}>{i + 1}</span>
              {s.team.flagUrl && (
                <Image src={s.team.flagUrl} alt={s.team.name} width={20} height={14} className="rounded-sm object-cover" unoptimized />
              )}
              <span className="flex-1 text-xs font-semibold truncate" style={{ color: '#E8F0FF' }}>{s.team.name}</span>
            </div>
          ))}
          <div className="mt-1 rounded-lg px-3 py-2 text-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
            <p className="text-[11px]" style={{ color: '#7A91BB' }}>
              Predict more scores for this group to display its winners
            </p>
            <p className="text-[10px] mt-0.5" style={{ color: '#5A6E94' }}>{totalMatches - predictedCount} match{totalMatches - predictedCount !== 1 ? 'es' : ''} remaining</p>
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
    <div className="rounded-xl p-3" style={{ background: '#0A1128', border: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-black" style={{ color: '#E8F0FF' }}>🏅 Best 3rd-Place Teams</h3>
        <span className="text-[10px]" style={{ color: '#7A91BB' }}>{groupsComplete}/{totalGroups} groups</span>
      </div>
      <p className="mb-3 text-[11px]" style={{ color: '#7A91BB' }}>
        The 8 best 3rd-place finishers across all 12 groups advance to Round of 32.
      </p>

      {groupsComplete === 0 ? (
        <div className="rounded-lg px-3 py-4 text-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
          <p className="text-[11px]" style={{ color: '#7A91BB' }}>Predict more scores for this group to display its winners</p>
          <p className="text-[10px] mt-0.5" style={{ color: '#5A6E94' }}>Complete all 6 matches in a group to see its 3rd-place team</p>
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
                  <span className={`w-5 text-center text-xs font-bold ${willAdvance ? 'text-brand' : ''}`} style={!willAdvance ? { color: '#5A6E94' } : undefined}>{i + 1}</span>
                  {s.team.flagUrl && (
                    <Image src={s.team.flagUrl} alt={s.team.name} width={20} height={14} className="rounded-sm object-cover" unoptimized />
                  )}
                  <span className="flex-1 text-xs font-semibold truncate" style={{ color: '#E8F0FF' }}>{s.team.name}</span>
                  <span className="text-[10px] font-mono" style={{ color: '#7A91BB' }}>Grp {r.groupLetter}</span>
                  <div className="flex items-center gap-2 text-[10px] font-mono" style={{ color: '#7A91BB' }}>
                    <span className="font-bold" style={{ color: '#E8F0FF' }}>{s.pts}pt</span>
                    <span className={gd > 0 ? 'text-accent' : gd < 0 ? 'text-red-400' : ''}>{gd > 0 ? '+' : ''}{gd}</span>
                  </div>
                  {willAdvance && <span className="text-[10px] font-semibold text-brand">✓ ADV</span>}
                </div>
              );
            })}
          </div>

          {groupsComplete < totalGroups && (
            <div className="mt-2 rounded-lg px-3 py-2 text-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
              <p className="text-[11px]" style={{ color: '#7A91BB' }}>
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

// ─── By Game tab ─────────────────────────────────────────────────────────────

function PointsPill({ pts }: { pts: number }) {
  if (pts >= 6) return (
    <span className="whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-black"
      style={{ background: 'rgba(255,176,32,0.15)', color: '#FFB020', border: '1px solid rgba(255,176,32,0.3)' }}>
      🌟 +{pts} pts
    </span>
  );
  if (pts >= 3) return (
    <span className="whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold"
      style={{ background: 'rgba(255,176,32,0.10)', color: '#FFB020', border: '1px solid rgba(255,176,32,0.2)' }}>
      ⭐ +{pts} pts
    </span>
  );
  if (pts > 0) return (
    <span className="whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold"
      style={{ background: 'rgba(0,196,79,0.10)', color: '#00C44F', border: '1px solid rgba(0,196,79,0.2)' }}>
      +{pts} pts
    </span>
  );
  return (
    <span className="whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold"
      style={{ background: 'rgba(255,255,255,0.04)', color: '#5A6E94', border: '1px solid rgba(255,255,255,0.08)' }}>
      0 pts
    </span>
  );
}

function ResultCard({ match, prediction, userId }: {
  match: Match;
  prediction: Prediction;
  userId: string;
}) {
  const [open, setOpen] = useState(false);
  const hasScore = match.homeScore !== null && match.awayScore !== null;

  const pts = hasScore
    ? calcPoints(prediction, {
        homeScore: match.homeScore!,
        awayScore: match.awayScore!,
        homeScorers: match.homeScorers,
        awayScorers: match.awayScorers,
      })
    : null;

  return (
    <>
      <button
        className="w-full text-left rounded-2xl overflow-hidden active:scale-[0.99] transition-transform"
        style={{
          background: 'linear-gradient(160deg, #0E1535 0%, #0A1128 100%)',
          border: '1px solid rgba(255,255,255,0.07)',
        }}
        onClick={() => setOpen(true)}
      >
        {/* Stage + date */}
        <div className="flex items-center justify-between px-4 pt-3 pb-1">
          <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: '#5A6E94' }}>
            {match.homeTeam.group ? `Group ${match.homeTeam.group} · ` : ''}{STAGE_LABELS[match.stage]}
          </span>
          <span className="text-[10px]" style={{ color: '#5A6E94' }}>{formatKickoff(match.kickoffAt)}</span>
        </div>

        {/* Teams + actual score */}
        <div className="flex items-center justify-between px-4 py-2 gap-2">
          {/* Home */}
          <div className="flex flex-1 flex-col items-center gap-1">
            <FlagImage code={match.homeTeam.code} size={32} className="rounded-sm" />
            <span className="text-[11px] font-black text-center leading-tight"
              style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#E8F0FF', letterSpacing: '0.03em' }}>
              {match.homeTeam.name.toUpperCase()}
            </span>
          </div>

          {/* Score */}
          <div className="flex flex-col items-center gap-0.5">
            {hasScore ? (
              <div className="flex items-baseline gap-1 rounded-xl px-3 py-1.5"
                style={{ background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ fontFamily: 'var(--font-barlow-condensed)', fontSize: 28, fontWeight: 900, color: '#E8F0FF', lineHeight: 1 }}>
                  {match.homeScore}
                </span>
                <span style={{ fontFamily: 'var(--font-barlow-condensed)', fontSize: 18, fontWeight: 700, color: '#3A4E6E', lineHeight: 1 }}>:</span>
                <span style={{ fontFamily: 'var(--font-barlow-condensed)', fontSize: 28, fontWeight: 900, color: '#E8F0FF', lineHeight: 1 }}>
                  {match.awayScore}
                </span>
              </div>
            ) : (
              <span className="text-xs font-bold" style={{ color: '#3A4E6E' }}>FT</span>
            )}
            <span className="text-[9px] uppercase tracking-wide" style={{ color: '#3A4E6E' }}>Final</span>
          </div>

          {/* Away */}
          <div className="flex flex-1 flex-col items-center gap-1">
            <FlagImage code={match.awayTeam.code} size={32} className="rounded-sm" />
            <span className="text-[11px] font-black text-center leading-tight"
              style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#E8F0FF', letterSpacing: '0.03em' }}>
              {match.awayTeam.name.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Footer: your pick + points */}
        <div className="mx-3 mb-3 mt-1 flex items-center justify-between rounded-xl px-3 py-2"
          style={{ background: 'rgba(0,0,0,0.2)' }}>
          <span className="text-[11px]" style={{ color: '#7A91BB' }}>
            Your pick: <span style={{ color: '#E8F0FF', fontWeight: 700 }}>
              {prediction.homeScore}–{prediction.awayScore}
            </span>
          </span>
          {pts !== null ? <PointsPill pts={pts} /> : (
            <span className="text-[11px]" style={{ color: '#5A6E94' }}>Pending</span>
          )}
        </div>
      </button>

      <PredictionModal
        match={match}
        userId={userId}
        existing={prediction}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}

function ByGameTab({ saved, userId }: { saved: Record<string, Prediction>; userId: string }) {
  const { getLiveMatch } = useMatchesStore();

  const finishedMatches = useMemo(() => {
    return ALL_MATCHES
      .filter(m => saved[m.id] && getLiveMatch(m).status === 'finished')
      .map(m => getLiveMatch(m))
      .sort((a, b) => b.kickoffAt.localeCompare(a.kickoffAt)); // most recent first
  }, [saved, getLiveMatch]);

  const totalPts = useMemo(() => {
    return finishedMatches.reduce((sum, m) => {
      if (m.homeScore === null || m.awayScore === null) return sum;
      return sum + calcPoints(saved[m.id], {
        homeScore: m.homeScore,
        awayScore: m.awayScore,
        homeScorers: m.homeScorers,
        awayScorers: m.awayScorers,
      });
    }, 0);
  }, [finishedMatches, saved]);

  if (finishedMatches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
        <div className="mb-4 text-5xl">🏁</div>
        <h2 className="mb-2 text-lg font-bold" style={{ color: '#E8F0FF' }}>No Results Yet</h2>
        <p className="text-sm" style={{ color: '#7A91BB' }}>Finished matches with your predictions will appear here</p>
      </div>
    );
  }

  return (
    <div className="mt-3 flex flex-col gap-3 px-4 pb-4">
      {/* Running total */}
      <div className="flex items-center justify-between rounded-xl px-4 py-2.5"
        style={{ background: 'rgba(255,176,32,0.08)', border: '1px solid rgba(255,176,32,0.2)' }}>
        <span className="text-sm" style={{ color: '#7A91BB' }}>
          {finishedMatches.length} game{finishedMatches.length !== 1 ? 's' : ''} played
        </span>
        <span className="text-lg font-black" style={{ color: '#FFB020' }}>+{totalPts} pts total</span>
      </div>

      {finishedMatches.map(match => (
        <ResultCard
          key={match.id}
          match={match}
          prediction={saved[match.id]}
          userId={userId}
        />
      ))}
    </div>
  );
}

// ─── Groups tab ───────────────────────────────────────────────────────────────

function GroupsTab({ saved }: { saved: Record<string, Prediction> }) {
  const { results, total } = useMemo(() => calcGroupPoints(saved), [saved]);
  const resultsByGroup = Object.fromEntries(results.map(r => [r.groupLetter, r]));

  // Determine which 3rd-place teams actually advance (best 8 of 12 by pts → GD → GF).
  // This is computed once here and passed to every GroupCard so the pink highlight
  // only appears on the groups whose 3rd-place team makes the cut.
  const advancingThirdIds = useMemo<Set<string>>(() => {
    const thirds: Array<{ teamId: string; standing: Standing }> = [];

    Object.keys(GROUPS).forEach(letter => {
      const { standings, complete } = buildPredictedStandings(letter, saved);
      if (complete && standings[2]) {
        thirds.push({ teamId: standings[2].team.id, standing: standings[2] });
      }
    });

    thirds.sort((a, b) => {
      const sa = a.standing; const sb = b.standing;
      if (sb.pts !== sa.pts) return sb.pts - sa.pts;
      const gdDiff = (sb.gf - sb.ga) - (sa.gf - sa.ga);
      if (gdDiff !== 0) return gdDiff;
      return sb.gf - sa.gf;
    });

    return new Set(thirds.slice(0, 8).map(t => t.teamId));
  }, [saved]);

  return (
    <div className="mt-4 flex flex-col gap-3 px-4">
      {total > 0 && (
        <div className="flex items-center justify-between rounded-xl bg-gold/10 border border-gold/30 px-4 py-2.5">
          <span className="text-sm" style={{ color: '#7A91BB' }}>Group stage points earned</span>
          <span className="text-lg font-black text-gold">+{total} pts</span>
        </div>
      )}
      <p className="text-xs -mb-1" style={{ color: '#7A91BB' }}>
        Your predicted group standings — based on your score picks across all 6 group matches.
        <span className="text-accent font-semibold"> Green = auto-advance</span>,{' '}
        <span className="text-brand font-semibold">pink = best 3rd advances</span>.
      </p>
      {Object.keys(GROUPS).map(letter => (
        <GroupCard key={letter} letter={letter} saved={saved} pointsResult={resultsByGroup[letter]} advancingThirdIds={advancingThirdIds} />
      ))}
      <BestThirdSection saved={saved} />
    </div>
  );
}

function PredictionsContent() {
  const { user } = useAuthStore();
  const { saved } = usePredictionsStore();
  const [subTab, setSubTab] = useState<SubTab>('groups');

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
        <div className="mb-4 text-5xl">🎯</div>
        <h2 className="mb-2 text-xl font-bold" style={{ color: '#E8F0FF' }}>Your Picks</h2>
        <p className="mb-6 text-sm" style={{ color: '#7A91BB' }}>Sign in to start making predictions and earn points</p>
        <Link href="/auth/register" className="rounded-xl bg-brand px-6 py-3 text-sm font-semibold" style={{ color: '#06091A' }}>
          Create Account
        </Link>
      </div>
    );
  }

  const totalPredictions = Object.keys(saved).length;

  return (
    <div className="flex flex-col pb-4">
      {/* Header */}
      <div className="px-4 pt-4 pb-3">
        <h1 className="text-2xl font-black" style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#E8F0FF', letterSpacing: '0.02em' }}>RESULTS</h1>
        <p className="text-xs" style={{ color: '#7A91BB' }}>{totalPredictions} prediction{totalPredictions !== 1 ? 's' : ''} made</p>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 px-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        {([
          { id: 'groups'  as SubTab, label: 'Groups'  },
          { id: 'by-game' as SubTab, label: 'By Game' },
        ]).map(t => (
          <button
            key={t.id}
            onClick={() => setSubTab(t.id)}
            className="flex-shrink-0 px-4 py-2.5 text-sm font-semibold transition-colors"
            style={subTab === t.id
              ? { borderBottom: '2px solid #FF4DA8', color: '#FF4DA8', marginBottom: -1 }
              : { borderBottom: '2px solid transparent', color: '#7A91BB' }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {subTab === 'groups'  && <GroupsTab saved={saved} />}
      {subTab === 'by-game' && <ByGameTab saved={saved} userId={user.id} />}
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
