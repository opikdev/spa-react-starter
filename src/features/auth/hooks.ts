import { useMutation, useQueryClient } from '@tanstack/react-query';
import { type Credentials, logIn, logOut, register, sessionQueryOptions } from './api';

function useStartSession(start: (credentials: Credentials) => Promise<void>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (credentials: Credentials) => {
      await start(credentials);
      return queryClient.fetchQuery({ ...sessionQueryOptions, staleTime: 0 });
    },
  });
}

export function useLogIn() {
  return useStartSession(logIn);
}

export function useRegister() {
  return useStartSession(async (credentials) => {
    await register(credentials);
    await logIn(credentials);
  });
}

export function useLogOut() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: logOut,
    onSuccess: () => {
      queryClient.setQueryData(sessionQueryOptions.queryKey, null);
      queryClient.removeQueries({
        predicate: (query) => query.queryKey[0] !== sessionQueryOptions.queryKey[0],
      });
    },
  });
}
