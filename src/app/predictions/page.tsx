'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuthStore, usePredictionsStore } from '@/store';
import { ALL_MATCHES, GROUP_STAGE_MATCHES, KNOCKOUT_MATCHES, STAGE_LABELS } from '@/data/matches';
import { GROUPS, ALL_TEAMS } from '@/data/teams';
import { ROSTERS } from '@/data/rosters';
import { ClientOnly } from '@/components/ui/ClientOnly';
import Link from 'next/link';
import Image from 'next/image';
import { calcGroupPoints } from '@/lib/utils/calcGroupPoints';
import { calcPoints } from '@/lib/utils/calcPoints';
import { getGradingScore } from '@/lib/utils/getGradingScore';
import { SCORING } from '@/lib/constants/scoring';
import { FlagImage } from '@/components/ui/FlagImage';
import { PredictionModal } from '@/components/predictions/PredictionModal';
import { FirstPredictionModal } from '@/components/predictions/FirstPredictionModal';
import { GoalsTab } from '@/components/predictions/GoalsTab';
import { useMatchesStore } from '@/store/slices/matchesSlice';
import { computeKnockoutTeams, resolveMatchTeams } from '@/lib/utils/knockoutAdvancement';
import { formatKickoff } from '@/lib/utils/formatDate';
import { saveTournamentPick, getTournamentPick, subscribeToTournamentSettings } from '@/lib/tournamentService';
import type { Match, Team } from '@/types/match';
import type { Prediction } from '@/types/prediction';

type SubTab = 'groups' | 'standings' | 'goals' | 'point-rules';


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

function matchBreakdown(pred: Prediction, m: Match): { label: string; pts: number; na?: boolean }[] {
  const isFinished = m.status === 'finished' && m.homeScore !== null;
  const items: { label: string; pts: number; na?: boolean }[] = [];

  if (!isFinished) {
    // Upcoming — show potential
    items.push({ label: `Home score (you: ${pred.homeScore})`, pts: SCORING.CORRECT_SCORE_PER_TEAM, na: true });
    items.push({ label: `Away score (you: ${pred.awayScore})`, pts: SCORING.CORRECT_SCORE_PER_TEAM, na: true });
    const outcome = pred.homeScore > pred.awayScore ? 'Home win' : pred.homeScore < pred.awayScore ? 'Away win' : 'Draw';
    items.push({ label: `Result — predicted: ${outcome}`, pts: SCORING.CORRECT_OUTCOME, na: true });
  } else {
    const actual = { homeScore: m.homeScore!, awayScore: m.awayScore! };
    const homeExact = pred.homeScore === actual.homeScore;
    const awayExact = pred.awayScore === actual.awayScore;
    items.push({ label: `Home score — you: ${pred.homeScore} · result: ${actual.homeScore}`, pts: homeExact ? SCORING.CORRECT_SCORE_PER_TEAM : 0 });
    items.push({ label: `Away score — you: ${pred.awayScore} · result: ${actual.awayScore}`, pts: awayExact ? SCORING.CORRECT_SCORE_PER_TEAM : 0 });
    if (!homeExact && !awayExact) {
      const predOut = Math.sign(pred.homeScore - pred.awayScore);
      const actOut  = Math.sign(actual.homeScore - actual.awayScore);
      items.push(predOut === actOut
        ? { label: 'Correct result (W/D/L)', pts: SCORING.CORRECT_OUTCOME }
        : { label: 'Wrong result',           pts: SCORING.WRONG_OUTCOME });
    } else {
      items.push({ label: 'Result (W/D/L) — covered by exact score', pts: 0, na: true });
    }
  }

  // Scorer picks
  const homePicks = pred.homeScorerPicks ?? [];
  const homeActualSet = m.homeScorers ? new Set(m.homeScorers) : null;
  if (homePicks.length === 0) {
    items.push({ label: 'Home scorer(s) — no pick', pts: 0 });
  } else {
    for (const pick of homePicks) {
      if (homeActualSet) items.push({ label: `Home scorer(s): ${pick}`, pts: homeActualSet.has(pick) ? SCORING.CORRECT_SCORER : SCORING.WRONG_SCORER });
      else items.push({ label: `Home scorer(s): ${pick}`, pts: 0, na: true });
    }
  }
  const awayPicks = pred.awayScorerPicks ?? [];
  const awayActualSet = m.awayScorers ? new Set(m.awayScorers) : null;
  if (awayPicks.length === 0) {
    items.push({ label: 'Away scorer(s) — no pick', pts: 0 });
  } else {
    for (const pick of awayPicks) {
      if (awayActualSet) items.push({ label: `Away scorer(s): ${pick}`, pts: awayActualSet.has(pick) ? SCORING.CORRECT_SCORER : SCORING.WRONG_SCORER });
      else items.push({ label: `Away scorer(s): ${pick}`, pts: 0, na: true });
    }
  }
  return items;
}

function GroupCard({ letter, saved, pointsResult, advancingThirdIds }: {
  letter: string;
  saved: Record<string, Prediction>;
  pointsResult?: { points: number; winnerCorrect: boolean; runnerUpCorrect: boolean; thirdCorrect: boolean };
  advancingThirdIds: Set<string>;
}) {
  const [expandedMatch, setExpandedMatch] = useState<string | null>(null);

  const { standings, complete, predictedCount, totalMatches } = useMemo(
    () => buildPredictedStandings(letter, saved),
    [letter, saved]
  );

  const groupMatches = useMemo(
    () => GROUP_STAGE_MATCHES
      .filter(m => m.homeTeam.group === letter)
      .sort((a, b) => a.kickoffAt.localeCompare(b.kickoffAt)),
    [letter]
  );

  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: '#0A1128', border: '1px solid rgba(255,255,255,0.07)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 pt-3 pb-2">
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
        <>
          {/* ── Predicted Standings ── */}
          <div className="px-3 pb-2 flex flex-col gap-1.5">
            {standings.map((s, i) => {
              const correctVal = pointsResult !== undefined
                ? (i === 0 ? pointsResult.winnerCorrect : i === 1 ? pointsResult.runnerUpCorrect : i === 2 ? pointsResult.thirdCorrect : undefined)
                : undefined;
              const advancesThird = i === 2 && advancingThirdIds.has(s.team.id);
              return <TeamRow key={s.team.id} standing={s} rank={i + 1} advancesThird={advancesThird} correct={correctVal} />;
            })}
          </div>

          {/* ── Your Match Predictions ── */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="flex items-center justify-between px-3 pt-2 pb-1">
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#5A6E94' }}>Your Predictions</p>
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#5A6E94' }}>Pts</p>
            </div>
            {groupMatches.map(m => {
              const pred = saved[m.id];
              const isFinished = m.status === 'finished' && m.homeScore !== null;
              const matchPts = isFinished && pred
                ? calcPoints(pred, { homeScore: m.homeScore!, awayScore: m.awayScore! })
                : null;
              const isOpen = expandedMatch === m.id;
              const breakdown = pred ? matchBreakdown(pred, m) : [];
              const breakdownTotal = breakdown.filter(i => !i.na).reduce((s, i) => s + i.pts, 0);

              return (
                <div key={m.id} style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                  {/* Row — tappable */}
                  <button
                    className="no-press-ring w-full flex items-center gap-1.5 px-3 py-1.5 text-left"
                    onClick={() => setExpandedMatch(isOpen ? null : m.id)}
                  >
                    {/* Chevron */}
                    <span className="shrink-0 text-[9px]" style={{ color: '#3A4E6E' }}>{isOpen ? '▲' : '▾'}</span>
                    {/* Date */}
                    <span className="w-9 shrink-0 text-[10px]" style={{ color: '#5A6E94' }}>{fmtDate(m.kickoffAt)}</span>
                    {/* Home team */}
                    <div className="flex flex-1 items-center gap-1 justify-end min-w-0">
                      {m.homeTeam.flagUrl && <Image src={m.homeTeam.flagUrl} alt="" width={13} height={9} className="rounded-sm object-cover shrink-0" unoptimized />}
                      <span className="text-[10px] font-semibold shrink-0" style={{ color: '#C8D8F0' }}>{m.homeTeam.code}</span>
                    </div>
                    {/* Score */}
                    <div className="flex items-center gap-1 shrink-0">
                      {isFinished && (
                        <span className="text-[10px] font-bold" style={{ color: '#4A6090' }}>{m.homeScore}–{m.awayScore}</span>
                      )}
                      <span className="text-[10px] font-black px-1.5 py-0.5 rounded"
                        style={{ background: pred ? 'rgba(255,31,142,0.1)' : 'rgba(255,255,255,0.04)',
                                 color: pred ? '#FF4DA8' : '#3A4E6E',
                                 border: pred ? '1px solid rgba(255,31,142,0.2)' : '1px solid rgba(255,255,255,0.06)' }}>
                        {pred ? `${pred.homeScore}–${pred.awayScore}` : '–'}
                      </span>
                    </div>
                    {/* Away team */}
                    <div className="flex flex-1 items-center gap-1 min-w-0">
                      <span className="text-[10px] font-semibold shrink-0" style={{ color: '#C8D8F0' }}>{m.awayTeam.code}</span>
                      {m.awayTeam.flagUrl && <Image src={m.awayTeam.flagUrl} alt="" width={13} height={9} className="rounded-sm object-cover shrink-0" unoptimized />}
                    </div>
                    {/* Points */}
                    <span className="w-8 text-right text-[11px] font-black shrink-0"
                      style={{ color: matchPts === null ? '#3A4E6E' : matchPts > 0 ? '#FFB020' : matchPts < 0 ? '#FF4D4D' : '#5A6E94' }}>
                      {matchPts === null ? '—' : matchPts > 0 ? `+${matchPts}` : matchPts}
                    </span>
                  </button>

                  {/* Expanded breakdown */}
                  {isOpen && (
                    <div className="mx-3 mb-2 rounded-xl overflow-hidden" style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      {pred ? (
                        <>
                          {breakdown.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between px-3 py-1.5"
                              style={{ borderBottom: idx < breakdown.length - 1 ? '1px solid rgba(255,255,255,0.04)' : undefined }}>
                              <span className="text-[10px]"
                                style={{ color: item.na ? '#3A4E6E' : '#7A91BB', fontStyle: item.na ? 'italic' : undefined }}>
                                {item.label}
                              </span>
                              <span className="text-[11px] font-bold ml-2 shrink-0"
                                style={{ color: item.na ? '#3A4E6E' : item.pts > 0 ? '#00C44F' : item.pts < 0 ? '#FF4D4D' : '#5A6E94' }}>
                                {item.na ? '—' : item.pts > 0 ? `+${item.pts}` : item.pts}
                              </span>
                            </div>
                          ))}
                          {isFinished && (
                            <div className="flex items-center justify-between px-3 py-1.5" style={{ borderTop: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)' }}>
                              <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#7A91BB' }}>Total</span>
                              <span className="text-[12px] font-black"
                                style={{ color: breakdownTotal > 0 ? '#FFB020' : breakdownTotal < 0 ? '#FF4D4D' : '#5A6E94' }}>
                                {breakdownTotal > 0 ? `+${breakdownTotal}` : breakdownTotal} pts
                              </span>
                            </div>
                          )}
                        </>
                      ) : (
                        <p className="px-3 py-2 text-[10px] text-center" style={{ color: '#5A6E94' }}>No prediction made for this match</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div className="px-3 pb-3 flex flex-col gap-1.5">
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
            <p className="text-[11px]" style={{ color: '#7A91BB' }}>Predict more scores for this group to display its winners</p>
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

// ─── Point breakdown helper ───────────────────────────────────────────────────

interface BreakdownItem { label: string; pts: number; hit: boolean }

function buildBreakdown(prediction: Prediction, match: Match): BreakdownItem[] {
  const gradingScore = getGradingScore(match);
  if (!gradingScore) return [];
  const items: BreakdownItem[] = [];
  const { homeScore: ah, awayScore: aa } = gradingScore;
  const homeExact = prediction.homeScore === ah;
  const awayExact = prediction.awayScore === aa;

  items.push({ label: `${match.homeTeam.name} score`, pts: homeExact ? SCORING.CORRECT_SCORE_PER_TEAM : 0, hit: homeExact });
  items.push({ label: `${match.awayTeam.name} score`, pts: awayExact ? SCORING.CORRECT_SCORE_PER_TEAM : 0, hit: awayExact });

  if (!homeExact && !awayExact) {
    const outcomeHit = Math.sign(prediction.homeScore - prediction.awayScore) === Math.sign(ah - aa);
    const outcomeLabel = ah > aa ? 'Home win' : ah < aa ? 'Away win' : 'Draw';
    // +3 for correct outcome, -2 for wrong outcome
    items.push({ label: `Outcome (${outcomeLabel})`, pts: outcomeHit ? SCORING.CORRECT_OUTCOME : SCORING.WRONG_OUTCOME, hit: outcomeHit });
  }

  if (match.homeScorers !== undefined) {
    const actualSet = new Set(match.homeScorers);
    for (const pick of (prediction.homeScorerPicks ?? []))
      items.push({ label: pick, pts: actualSet.has(pick) ? SCORING.CORRECT_SCORER : SCORING.WRONG_SCORER, hit: actualSet.has(pick) });
  }
  if (match.awayScorers !== undefined) {
    const actualSet = new Set(match.awayScorers);
    for (const pick of (prediction.awayScorerPicks ?? []))
      items.push({ label: pick, pts: actualSet.has(pick) ? SCORING.CORRECT_SCORER : SCORING.WRONG_SCORER, hit: actualSet.has(pick) });
  }

  return items;
}

// ─── Result card ──────────────────────────────────────────────────────────────

function ResultCard({ match, prediction, userId }: {
  match: Match;
  prediction: Prediction;
  userId: string;
}) {
  const [open, setOpen] = useState(false);
  const [showFirstPrediction, setShowFirstPrediction] = useState(false);
  const hasScore = match.homeScore !== null && match.awayScore !== null;

  const gradingScore = hasScore ? getGradingScore(match) : null;
  const pts = gradingScore
    ? calcPoints(prediction, {
        homeScore: gradingScore.homeScore,
        awayScore: gradingScore.awayScore,
        homeScorers: match.homeScorers,
        awayScorers: match.awayScorers,
      })
    : null;

  const breakdown = hasScore ? buildBreakdown(prediction, match) : [];
  const ptColor = pts === null ? '#7A91BB' : pts >= 3 ? '#FFB020' : pts > 0 ? '#00C44F' : pts < 0 ? '#FF4D4D' : '#7A91BB';
  const ptLabel = pts === null ? '–' : pts >= 6 ? `🌟 +${pts} pts` : pts >= 3 ? `⭐ +${pts} pts` : pts > 0 ? `✓ +${pts} pts` : pts < 0 ? `✗ ${pts} pts` : '✗ 0 pts';

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

        {/* Results card + point breakdown */}
        {hasScore ? (
          <div className="mx-3 mb-3 mt-1 rounded-xl overflow-hidden"
            style={{ border: '1px solid rgba(255,255,255,0.08)' }}>

            {/* Row 1: Final Score */}
            <div className="flex items-center justify-between px-4 py-2.5"
              style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#7A91BB' }}>Final Score</span>
              <span className="text-xl font-black" style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#E8F0FF' }}>
                {match.homeScore} – {match.awayScore}
              </span>
            </div>

            {/* Row 2: Your Prediction */}
            <div className="flex items-center justify-between px-4 py-2.5"
              style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#7A91BB' }}>Your Prediction</span>
              <span className="text-xl font-black" style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#E8F0FF' }}>
                {prediction.homeScore} – {prediction.awayScore}
              </span>
            </div>

            {/* Row 3: Points Earned */}
            <div className="flex items-center justify-between px-4 py-2.5"
              style={{ background: 'rgba(255,255,255,0.03)', borderBottom: breakdown.length > 0 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
              <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#7A91BB' }}>Points Earned</span>
              <span className="text-xl font-black" style={{ fontFamily: 'var(--font-barlow-condensed)', color: ptColor }}>
                {ptLabel}
              </span>
            </div>

            {/* Breakdown rows */}
            {breakdown.length > 0 && (
              <div style={{ background: 'rgba(0,0,0,0.18)' }}>
                <div className="px-4 pt-2.5 pb-1">
                  <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: '#3A4E6E' }}>Breakdown</span>
                </div>
                {breakdown.map((item, i) => (
                  <div key={i}
                    className="flex items-center justify-between px-4 py-1.5"
                    style={i < breakdown.length - 1 ? { borderBottom: '1px solid rgba(255,255,255,0.04)' } : undefined}>
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[11px] shrink-0" style={{ color: item.hit ? '#00C44F' : '#FF4D4D' }}>
                        {item.hit ? '✓' : '✗'}
                      </span>
                      <span className="text-[11px] truncate" style={{ color: '#C8D0E0' }}>{item.label}</span>
                    </div>
                    <span className="text-[11px] font-bold ml-3 shrink-0"
                      style={{ color: item.pts > 0 ? '#00C44F' : item.pts < 0 ? '#FF4D4D' : '#5A6E94' }}>
                      {item.pts > 0 ? `+${item.pts}` : item.pts === 0 ? '–' : `${item.pts}`}
                    </span>
                  </div>
                ))}
                <div className="h-2.5" />
              </div>
            )}
          </div>
        ) : (
          /* Pending state — no score yet */
          <div className="mx-3 mb-3 mt-1 flex items-center justify-between rounded-xl px-3 py-2"
            style={{ background: 'rgba(0,0,0,0.2)' }}>
            <span className="text-[11px]" style={{ color: '#7A91BB' }}>
              Your pick: <span style={{ color: '#E8F0FF', fontWeight: 700 }}>
                {prediction.homeScore}–{prediction.awayScore}
              </span>
            </span>
            <span className="text-[11px]" style={{ color: '#5A6E94' }}>Pending</span>
          </div>
        )}
      </button>

      <PredictionModal
        match={match}
        userId={userId}
        existing={prediction}
        open={open}
        onClose={() => setOpen(false)}
        onFirstEverPrediction={() => setShowFirstPrediction(true)}
      />
      <FirstPredictionModal
        open={showFirstPrediction}
        onClose={() => setShowFirstPrediction(false)}
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
      const gradingScore = getGradingScore(m);
      if (!gradingScore) return sum;
      return sum + calcPoints(saved[m.id], {
        homeScore: gradingScore.homeScore,
        awayScore: gradingScore.awayScore,
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

// ─── Picks tab (Golden Boot etc.) ────────────────────────────────────────────

// Golden Boot picks lock at midnight EST on June 18 (after all group stage matches).
// Midnight EST = 05:00 UTC the following day.
const GOLDEN_BOOT_LOCK = '2026-06-19T05:00:00Z';

function PicksTab({ userId }: { userId: string }) {
  const [goldenBootPick, setGoldenBootPick] = useState<string | null>(null);
  const [goldenBootWinner, setGoldenBootWinner] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const isLocked = typeof window !== 'undefined' && new Date() >= new Date(GOLDEN_BOOT_LOCK);

  useEffect(() => {
    let cancelled = false;
    getTournamentPick(userId).then(data => {
      if (!cancelled) {
        setGoldenBootPick(data?.goldenBootPick ?? null);
        setLoading(false);
      }
    });
    const unsub = subscribeToTournamentSettings((settings) => {
      if (!cancelled) setGoldenBootWinner(settings.goldenBootWinner ?? null);
    });
    return () => { cancelled = true; unsub(); };
  }, [userId]);

  // Flat sorted player list from all team rosters
  const allPlayers = useMemo(() => {
    return ALL_TEAMS
      .filter(t => ROSTERS[t.id])
      .flatMap(team =>
        (['forwards', 'midfielders', 'defenders', 'goalkeepers'] as const).flatMap(pos =>
          (ROSTERS[team.id].squad[pos] ?? []).map(name => ({
            name,
            teamName: team.name,
            teamCode: team.code,
          }))
        )
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  const filteredPlayers = search.length >= 2
    ? allPlayers.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.teamName.toLowerCase().includes(search.toLowerCase())
      ).slice(0, 60) // cap results for performance
    : [];

  async function selectPlayer(name: string) {
    setGoldenBootPick(name);  // optimistic
    setShowSearch(false);
    setSearch('');
    await saveTournamentPick(userId, { goldenBootPick: name });
  }

  const goldenBootPts = goldenBootWinner !== null
    ? (goldenBootPick === goldenBootWinner ? SCORING.CORRECT_GOLDEN_BOOT : 0)
    : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-5 w-24 animate-pulse rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }} />
      </div>
    );
  }

  return (
    <div className="mt-3 px-4 pb-4 flex flex-col gap-3">

      {/* ── Golden Boot card ──────────────────────────────────────────── */}
      <div className="rounded-xl overflow-hidden" style={{ background: '#0A1128', border: '1px solid rgba(255,255,255,0.07)' }}>

        {/* Header row */}
        <div className="flex items-start justify-between px-4 pt-3 pb-2.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div>
            <h3 className="text-sm font-black" style={{ color: '#E8F0FF' }}>🥇 Golden Boot</h3>
            <p className="text-[10px] mt-0.5" style={{ color: '#7A91BB' }}>Who will be the tournament's top scorer?</p>
          </div>
          {isLocked
            ? <span className="text-[10px] font-semibold rounded-full px-2.5 py-1 shrink-0" style={{ background: 'rgba(255,255,255,0.05)', color: '#5A6E94', border: '1px solid rgba(255,255,255,0.08)' }}>🔒 Locked</span>
            : <span className="text-[10px] font-semibold rounded-full px-2.5 py-1 shrink-0" style={{ background: 'rgba(0,196,79,0.1)', color: '#00C44F', border: '1px solid rgba(0,196,79,0.2)' }}>Open</span>
          }
        </div>

        {/* Points badge */}
        <div className="flex items-center gap-2 px-4 py-2" style={{ background: 'rgba(255,176,32,0.05)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
          <span className="text-[11px] font-bold" style={{ color: '#FFB020' }}>+{SCORING.CORRECT_GOLDEN_BOOT} pts</span>
          <span className="text-[11px]" style={{ color: '#5A6E94' }}>for the correct pick · penalty shootout goals don't count</span>
        </div>

        {/* Pick area */}
        <div className="px-4 py-3">
          {/* Golden boot winner banner */}
          {goldenBootWinner && (
            <div className="mb-3 rounded-lg px-3 py-2" style={{ background: 'rgba(255,176,32,0.1)', border: '1px solid rgba(255,176,32,0.25)' }}>
              <p className="text-[9px] font-bold uppercase tracking-widest mb-0.5" style={{ color: '#FFB020' }}>🏆 Tournament Golden Boot</p>
              <p className="text-sm font-bold" style={{ color: '#E8F0FF' }}>{goldenBootWinner}</p>
            </div>
          )}

          {goldenBootPick ? (
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[9px] font-bold uppercase tracking-widest mb-0.5" style={{ color: '#7A91BB' }}>Your Pick</p>
                <p className="text-sm font-bold truncate" style={{ color: '#E8F0FF' }}>{goldenBootPick}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {goldenBootPts !== null && (
                  <span className="text-sm font-black" style={{
                    fontFamily: 'var(--font-barlow-condensed)',
                    color: goldenBootPts > 0 ? '#FFB020' : '#5A6E94',
                  }}>
                    {goldenBootPts > 0 ? `🌟 +${goldenBootPts} pts` : '✗ 0 pts'}
                  </span>
                )}
                {!isLocked && (
                  <button
                    onClick={() => setShowSearch(true)}
                    className="text-[11px] font-semibold px-2.5 py-1 rounded-lg"
                    style={{ background: 'rgba(255,255,255,0.06)', color: '#7A91BB', border: '1px solid rgba(255,255,255,0.1)' }}
                  >
                    Change
                  </button>
                )}
              </div>
            </div>
          ) : isLocked ? (
            <p className="text-sm text-center py-2" style={{ color: '#5A6E94' }}>No pick was made before the June 18 deadline</p>
          ) : (
            <button
              onClick={() => setShowSearch(true)}
              className="w-full rounded-xl py-2.5 text-sm font-semibold active:scale-98"
              style={{ background: 'rgba(255,31,142,0.1)', border: '1px solid rgba(255,31,142,0.3)', color: '#FF4DA8' }}
            >
              + Pick a player
            </button>
          )}

          {/* Search panel */}
          {showSearch && (
            <div className="mt-3">
              <input
                type="text"
                placeholder="Search by name or country…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                autoFocus
                className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)', color: '#E8F0FF' }}
              />
              {search.length >= 2 ? (
                <div className="mt-1.5 rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)', maxHeight: 220, overflowY: 'auto' }}>
                  {filteredPlayers.length === 0 ? (
                    <p className="px-3 py-3 text-xs text-center" style={{ color: '#5A6E94' }}>No players found</p>
                  ) : filteredPlayers.map(p => (
                    <button
                      key={`${p.name}-${p.teamCode}`}
                      onClick={() => selectPlayer(p.name)}
                      className="w-full flex items-center justify-between px-3 py-2 text-left"
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: goldenBootPick === p.name ? 'rgba(255,176,32,0.08)' : 'transparent' }}
                    >
                      <span className="text-sm font-semibold" style={{ color: goldenBootPick === p.name ? '#FFB020' : '#E8F0FF' }}>{p.name}</span>
                      <span className="text-[10px] shrink-0 ml-2" style={{ color: '#5A6E94' }}>{p.teamName}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-xs text-center" style={{ color: '#5A6E94' }}>Type 2+ characters to search</p>
              )}
              <button
                onClick={() => { setShowSearch(false); setSearch(''); }}
                className="w-full mt-2 py-1.5 text-xs rounded-lg"
                style={{ color: '#5A6E94' }}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Info note ─────────────────────────────────────────────────── */}
      <div className="rounded-xl px-4 py-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <p className="text-xs font-semibold mb-1" style={{ color: '#7A91BB' }}>How the Golden Boot works</p>
        <p className="text-[11px] leading-relaxed" style={{ color: '#5A6E94' }}>
          The player with the most goals across all tournament matches wins the Golden Boot.
          Goals scored in penalty shootouts are not counted — only goals in regular and extra time.
          Picks lock when the tournament begins on June 11.
        </p>
      </div>

    </div>
  );
}

// ─── Point Rules tab ─────────────────────────────────────────────────────────

function RuleRow({ desc, note, pts, color = '#FFB020' }: {
  desc: string; note?: string; pts: string; color?: string;
}) {
  return (
    <div className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <div className="flex-1 min-w-0">
        <span className="text-sm" style={{ color: '#C8D0E0' }}>{desc}</span>
        {note && <span className="ml-1.5 text-[10px]" style={{ color: '#5A6E94' }}>{note}</span>}
      </div>
      <span className="ml-3 text-sm font-black shrink-0" style={{ color, fontFamily: 'var(--font-barlow-condensed)' }}>{pts}</span>
    </div>
  );
}

function RuleSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-3 rounded-xl overflow-hidden" style={{ background: '#0E1535', border: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="px-4 pt-3 pb-1">
        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#FF4DA8' }}>{title}</p>
      </div>
      <div className="px-4 pb-3">{children}</div>
    </div>
  );
}

function PointRulesTab() {
  return (
    <div className="mt-3 px-4 pb-4">
      <RuleSection title="Score Predictions">
        <RuleRow desc="Both scores exact (perfect)" note="3 + 3 pts" pts="+6" />
        <RuleRow desc="One score exact"             note="per correct team" pts="+3" />
        <RuleRow desc="Correct outcome (W / D / L)" note="if no exact score" pts="+3" />
        <RuleRow desc="Wrong outcome (W / D / L)"   note="if no exact score" pts="−2" color="#FF4D4D" />
      </RuleSection>

      <RuleSection title="Scorer Picks">
        <RuleRow desc="Player you picked scores"        pts="+2" color="#00C44F" />
        <RuleRow desc="Player you picked doesn't score" pts="−1" color="#FF4D4D" />
      </RuleSection>

      <RuleSection title="Knockout Stage Scoring">
        <RuleRow desc="Score graded on 90-min result" note="not ET / shootout" pts="" color="#7A91BB" />
        <RuleRow desc="Correct finalist" pts="+4" />
        <RuleRow desc="Correct champion" pts="+10" />
      </RuleSection>

      <RuleSection title="Group Stage Standings">
        <RuleRow desc="Group winner correct"  pts="+3" />
        <RuleRow desc="Runner-up correct"     pts="+2" />
        <RuleRow desc="3rd place correct"     pts="+1" />
      </RuleSection>

      <RuleSection title="Tournament Picks">
        <RuleRow desc="Golden Boot (top scorer)" note="shootout goals don't count" pts="+10" />
      </RuleSection>
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

// ─── Standings Tab ────────────────────────────────────────────────────────────

type StandingsUpdateRecord = Record<string, { homeScore: number | null; awayScore: number | null; status: string }>;

function buildActualStandings(groupLetter: string, updates: StandingsUpdateRecord = {}) {
  const teams = GROUPS[groupLetter] ?? [];
  const standings: Standing[] = teams.map(team => ({ team, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, pts: 0 }));
  const byId = Object.fromEntries(standings.map(s => [s.team.id, s]));

  GROUP_STAGE_MATCHES
    .filter(m => m.homeTeam.group === groupLetter)
    .forEach(m => {
      const upd = updates[m.id];
      const homeScore = upd?.homeScore ?? m.homeScore;
      const awayScore  = upd?.awayScore  ?? m.awayScore;
      const status     = upd?.status     ?? m.status;
      if (status !== 'finished' || homeScore === null || awayScore === null) return;
      const home = byId[m.homeTeam.id];
      const away = byId[m.awayTeam.id];
      if (!home || !away) return;
      home.played++; away.played++;
      home.gf += homeScore; home.ga += awayScore;
      away.gf += awayScore; away.ga += homeScore;
      if (homeScore > awayScore) { home.won++; home.pts += 3; away.lost++; }
      else if (homeScore < awayScore) { away.won++; away.pts += 3; home.lost++; }
      else { home.drawn++; home.pts++; away.drawn++; away.pts++; }
    });

  standings.sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    const gdDiff = (b.gf - b.ga) - (a.gf - a.ga);
    if (gdDiff !== 0) return gdDiff;
    return b.gf - a.gf;
  });

  return standings;
}

const KNOCKOUT_ROUND_ORDER: Match['stage'][] = ['round-of-32', 'round-of-16', 'quarter-final', 'semi-final', 'third-place', 'final'];

function StandingsTab() {
  const { updates, getLiveMatch } = useMatchesStore();

  // Resolve real team names for knockout matches as groups + rounds complete
  const ktm = useMemo(() => computeKnockoutTeams(updates), [updates]);

  // Determine which 3rd-place teams advance globally (best 8 of 12)
  const advancingThirdIds = useMemo<Set<string>>(() => {
    const thirds: { teamId: string; pts: number; gd: number; gf: number }[] = [];
    Object.keys(GROUPS).forEach(letter => {
      const s = buildActualStandings(letter, updates);
      if (s[2] && s[2].played > 0) {
        thirds.push({ teamId: s[2].team.id, pts: s[2].pts, gd: s[2].gf - s[2].ga, gf: s[2].gf });
      }
    });
    thirds.sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf);
    return new Set(thirds.slice(0, 8).map(t => t.teamId));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updates]);

  return (
    <div className="flex flex-col gap-4 px-4 pb-6 mt-4">

      {/* ── Group Stage ── */}
      <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#5A6E94' }}>Group Stage</p>

      {Object.keys(GROUPS).map(letter => {
        const standings = buildActualStandings(letter, updates);
        const played = standings.reduce((s, r) => s + r.played, 0) / 2;
        const total = GROUP_STAGE_MATCHES.filter(m => m.homeTeam.group === letter).length;

        return (
          <div key={letter} className="rounded-xl overflow-hidden" style={{ background: '#0A1128', border: '1px solid rgba(255,255,255,0.07)' }}>
            {/* Group header */}
            <div className="flex items-center justify-between px-3 py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <span className="text-sm font-black" style={{ color: '#E8F0FF' }}>Group {letter}</span>
              <span className="text-[10px]" style={{ color: '#5A6E94' }}>{played}/{total} played</span>
            </div>
            {/* Column headers */}
            <div className="flex items-center gap-2 px-3 py-1" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <span className="w-4" />
              <span className="flex-1 text-[9px] font-semibold uppercase tracking-widest" style={{ color: '#3A4E6E' }}>Team</span>
              <div className="flex items-center gap-3 text-[9px] font-semibold uppercase tracking-widest shrink-0" style={{ color: '#3A4E6E' }}>
                <span className="w-4 text-center">P</span>
                <span className="w-4 text-center">W</span>
                <span className="w-4 text-center">D</span>
                <span className="w-4 text-center">L</span>
                <span className="w-5 text-center">GD</span>
                <span className="w-5 text-center">Pts</span>
              </div>
            </div>
            {/* Rows */}
            {standings.map((s, i) => {
              const advancesAuto = i < 2;
              const advancesThird = i === 2 && advancingThirdIds.has(s.team.id);
              const gd = s.gf - s.ga;
              const dim = s.played === 0;
              return (
                <div key={s.team.id} className="flex items-center gap-2 px-3 py-1.5"
                  style={{
                    background: advancesAuto ? 'rgba(0,196,79,0.05)' : advancesThird ? 'rgba(255,31,142,0.06)' : 'transparent',
                    borderTop: i > 0 ? '1px solid rgba(255,255,255,0.04)' : undefined,
                    opacity: dim ? 0.4 : 1,
                  }}>
                  <span className="w-4 text-center text-[10px] font-bold shrink-0"
                    style={{ color: advancesAuto ? '#00C44F' : advancesThird ? '#FF4DA8' : '#5A6E94' }}>{i + 1}</span>
                  {s.team.flagUrl
                    ? <Image src={s.team.flagUrl} alt="" width={16} height={11} className="rounded-sm object-cover shrink-0" unoptimized />
                    : <span className="w-4 shrink-0" />}
                  <span className="flex-1 text-[11px] font-semibold truncate" style={{ color: '#E8F0FF' }}>{s.team.name}</span>
                  <div className="flex items-center gap-3 text-[10px] font-mono shrink-0" style={{ color: '#7A91BB' }}>
                    <span className="w-4 text-center">{s.played}</span>
                    <span className="w-4 text-center">{s.won}</span>
                    <span className="w-4 text-center">{s.drawn}</span>
                    <span className="w-4 text-center">{s.lost}</span>
                    <span className="w-5 text-center" style={{ color: gd > 0 ? '#00C44F' : gd < 0 ? '#FF4D4D' : '#7A91BB' }}>{gd > 0 ? `+${gd}` : gd}</span>
                    <span className="w-5 text-center font-bold" style={{ color: '#E8F0FF' }}>{s.pts}</span>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}

      {/* ── Knockout Rounds ── */}
      {KNOCKOUT_ROUND_ORDER.map(stage => {
        const matches = KNOCKOUT_MATCHES
          .filter(m => m.stage === stage)
          .sort((a, b) => a.kickoffAt.localeCompare(b.kickoffAt))
          // Overlay live scores then resolve real team names
          .map(m => resolveMatchTeams(getLiveMatch(m), ktm));
        const anyPlayed = matches.some(m => m.status !== 'upcoming');
        return (
          <div key={stage}>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest" style={{ color: '#5A6E94' }}>{STAGE_LABELS[stage]}</p>
            <div className="flex flex-col gap-2">
              {matches.map(m => {
                const isTbd = m.homeTeam.id === 'tbd';
                const isFinished = m.status === 'finished' && m.homeScore !== null;
                const isLive = m.status === 'live';
                const hasScore = m.homeScore !== null;
                const winner = isFinished ? (m.homeScore! > m.awayScore! ? 'home' : m.homeScore! < m.awayScore! ? 'away' : null) : null;
                return (
                  <div key={m.id} className="rounded-xl overflow-hidden" style={{ background: '#0A1128', border: `1px solid ${isLive ? 'rgba(255,176,32,0.25)' : 'rgba(255,255,255,0.07)'}` }}>
                    <div className="flex items-center px-3 py-2.5 gap-2">
                      {/* Home */}
                      <div className="flex flex-1 items-center gap-1.5 justify-end min-w-0">
                        <span className="text-[11px] font-semibold truncate"
                          style={{ color: winner === 'away' ? '#4A6090' : '#E8F0FF' }}>
                          {isTbd ? '—' : m.homeTeam.name}
                        </span>
                        {!isTbd && m.homeTeam.flagUrl && (
                          <Image src={m.homeTeam.flagUrl} alt="" width={18} height={13} className="rounded-sm object-cover shrink-0" unoptimized />
                        )}
                      </div>
                      {/* Score / VS */}
                      <div className="flex items-center justify-center shrink-0 rounded-lg px-2.5 py-1 min-w-[52px]"
                        style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        {hasScore ? (
                          <span style={{ fontFamily: 'var(--font-barlow-condensed)', fontSize: 16, fontWeight: 900, color: '#E8F0FF', letterSpacing: '0.05em' }}>
                            {m.homeScore} – {m.awayScore}
                          </span>
                        ) : isLive ? (
                          <span className="text-[11px] font-bold" style={{ color: '#FFB020' }}>LIVE</span>
                        ) : (
                          <span style={{ fontFamily: 'var(--font-barlow-condensed)', fontSize: 13, fontWeight: 900, color: '#3A4E6E', letterSpacing: '0.1em' }}>VS</span>
                        )}
                      </div>
                      {/* Away */}
                      <div className="flex flex-1 items-center gap-1.5 min-w-0">
                        {!isTbd && m.awayTeam.flagUrl && (
                          <Image src={m.awayTeam.flagUrl} alt="" width={18} height={13} className="rounded-sm object-cover shrink-0" unoptimized />
                        )}
                        <span className="text-[11px] font-semibold truncate"
                          style={{ color: winner === 'home' ? '#4A6090' : '#E8F0FF' }}>
                          {isTbd ? '—' : m.awayTeam.name}
                        </span>
                      </div>
                    </div>
                    {/* Footer */}
                    <div className="px-3 pb-2 flex items-center gap-1.5">
                      <span className="text-[10px]" style={{ color: '#5A6E94' }}>
                        {new Date(m.kickoffAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · {m.city.split(',')[0]}
                      </span>
                      {isFinished && <span className="text-[10px] font-bold rounded-full px-1.5" style={{ background: 'rgba(255,255,255,0.05)', color: '#7A91BB' }}>FT</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
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
      <div className="flex px-3 overflow-x-auto" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', scrollbarWidth: 'none' }}>
        {([
          { id: 'groups'      as SubTab, label: 'My Predictions' },
          { id: 'standings'   as SubTab, label: 'Standings'      },
          { id: 'goals'       as SubTab, label: 'Players'        },
          { id: 'point-rules' as SubTab, label: 'Rules'          },
        ]).map(t => (
          <button
            key={t.id}
            onClick={() => setSubTab(t.id)}
            className="no-press-ring flex-shrink-0 px-3 py-2.5 text-sm font-semibold transition-colors whitespace-nowrap"
            style={subTab === t.id
              ? { borderBottom: '2px solid #FF4DA8', color: '#FF4DA8', marginBottom: -1 }
              : { borderBottom: '2px solid transparent', color: '#7A91BB' }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {subTab === 'groups'      && <GroupsTab saved={saved} />}
      {subTab === 'standings'   && <StandingsTab />}
      {subTab === 'goals'       && <GoalsTab />}
      {subTab === 'point-rules' && <PointRulesTab />}
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
