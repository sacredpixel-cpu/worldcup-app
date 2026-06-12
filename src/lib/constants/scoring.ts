// Points awarded for each prediction outcome

export const SCORING = {
  CORRECT_OUTCOME: 3,         // right winner / draw
  WRONG_OUTCOME: 0,           // wrong winner / draw — no deduction
  CORRECT_SCORE_PER_TEAM: 3,  // exact score for one team (max 6 if both correct)
  CORRECT_FINALIST: 4,        // picked a finalist
  CORRECT_CHAMPION: 10,       // picked the champion
  CORRECT_GROUP_WINNER: 3,    // predicted the group winner correctly
  CORRECT_GROUP_RUNNER_UP: 2, // predicted the group runner-up correctly
  CORRECT_GROUP_THIRD: 1,     // predicted the group 3rd-place finisher correctly
  CORRECT_SCORER: 2,          // picked a player who actually scored
  WRONG_SCORER: -1,           // picked a player who did not score
  CORRECT_GOLDEN_BOOT: 10,    // correctly predicted the tournament top scorer
} as const;
