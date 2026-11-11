import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';
import { ApiError, problemTypes } from './api/problem';

function isSessionLost(error: unknown): boolean {
  return (
    error instanceof ApiError &&
    error.status === 401 &&
    error.type !== problemTypes.invalidCredentials
  );
}

function shouldRetry(failureCount: number, error: unknown): boolean {
  return failureCount < 2 && error instanceof TypeError;
}

export function createQueryClient(onSessionLost: () => void): QueryClient {
  const handleError = (error: unknown) => {
    if (isSessionLost(error)) onSessionLost();
  };
  return new QueryClient({
    queryCache: new QueryCache({ onError: handleError }),
    mutationCache: new MutationCache({ onError: handleError }),
    defaultOptions: {
      queries: { staleTime: 30_000, retry: shouldRetry },
      mutations: { retry: shouldRetry },
    },
  });
}
