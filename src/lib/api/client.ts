// Base Axios/Fetch client — attach auth token, base URL, error handling

import { API_BASE_URL } from '@/lib/constants/env';

export async function apiClient<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      // Auth token injected here from store
    },
    ...options,
  });
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`);
  return res.json() as Promise<T>;
}
