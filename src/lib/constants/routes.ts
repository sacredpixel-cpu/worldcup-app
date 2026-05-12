export const ROUTES = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
  },
  APP: {
    SCHEDULE: '/schedule',
    SCORES: '/scores',
    BRACKET: '/bracket',
    PREDICTIONS: '/predictions',
    LEADERBOARD: '/leaderboard',
    GROUPS: '/groups',
    GROUP_DETAIL: (id: string) => `/groups/${id}`,
    PROFILE: '/profile',
  },
} as const;
