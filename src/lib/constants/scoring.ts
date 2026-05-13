// Points awarded for each prediction outcome

export const SCORING = {
  CORRECT_OUTCOME: 3,       // right winner / draw
  CORRECT_SCORE_PER_TEAM: 5, // exact score for one team (max 10 if both correct)
  CORRECT_FINALIST: 4,      // picked a finalist
  CORRECT_CHAMPION: 10,     // picked the champion
} as const;
