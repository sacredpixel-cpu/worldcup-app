// Login, register, OAuth

import { apiClient } from '@/lib/api/client';
import type { User } from '@/types';

export const authService = {
  login: (email: string, password: string) =>
    apiClient<{ user: User; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  register: (data: { email: string; password: string; displayName: string }) =>
    apiClient<{ user: User; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getMe: () => apiClient<User>('/auth/me'),
};
