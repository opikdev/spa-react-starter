import { queryOptions } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { ApiError } from '@/lib/api/problem';
import { request } from '@/lib/api/request';
import type { components } from '@/lib/api/schema';

export type User = components['schemas']['User'];
export type Credentials = { email: string; password: string };

export const sessionQueryOptions = queryOptions({
  queryKey: ['session'],
  queryFn: async (): Promise<User | null> => {
    try {
      return (await request(api.GET('/v1/users/me'))).data;
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) return null;
      throw error;
    }
  },
  staleTime: 5 * 60_000,
});

export async function logIn(credentials: Credentials): Promise<void> {
  await request(api.POST('/v1/sessions', { body: { ...credentials, delivery: 'cookie' } }));
}

export async function logOut(): Promise<void> {
  try {
    await request(api.DELETE('/v1/sessions/current'));
  } catch (error) {
    if (!(error instanceof ApiError && error.status === 401)) throw error;
  }
}

export async function register(credentials: Credentials): Promise<void> {
  await request(api.POST('/v1/users', { body: credentials }));
}
