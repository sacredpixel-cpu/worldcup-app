import { GROUP_STAGE_MATCHES } from '@/data/matches';

// Group stage: M1–M72 assigned by chronological kickoff order
const sortedGroup = [...GROUP_STAGE_MATCHES].sort((a, b) =>
  a.kickoffAt.localeCompare(b.kickoffAt)
);
const GROUP_NUMBERS: Record<string, number> = Object.fromEntries(
  sortedGroup.map((m, i) => [m.id, i + 1])
);

// Knockout: official FIFA match numbers M73–M104
const KNOCKOUT_NUMBERS: Record<string, number> = {
  'R32-01': 73,  'R32-02': 74,  'R32-03': 75,  'R32-04': 76,
  'R32-05': 77,  'R32-06': 78,  'R32-07': 79,  'R32-08': 80,
  'R32-09': 81,  'R32-10': 82,  'R32-11': 83,  'R32-12': 84,
  'R32-13': 85,  'R32-14': 86,  'R32-15': 87,  'R32-16': 88,
  'R16-01': 89,  'R16-02': 90,  'R16-03': 91,  'R16-04': 92,
  'R16-05': 93,  'R16-06': 94,  'R16-07': 95,  'R16-08': 96,
  'QF-01':  97,  'QF-02':  98,  'QF-03':  99,  'QF-04': 100,
  'SF-01': 101,  'SF-02': 102,
  '3RD':   103,  'FINAL': 104,
};

export function getMatchNumber(matchId: string): number | null {
  return GROUP_NUMBERS[matchId] ?? KNOCKOUT_NUMBERS[matchId] ?? null;
}
