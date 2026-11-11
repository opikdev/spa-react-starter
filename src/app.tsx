import { QueryClientProvider } from '@tanstack/react-query';
import { type RouterHistory, RouterProvider } from '@tanstack/react-router';
import { sessionQueryOptions } from './features/auth';
import { createQueryClient } from './lib/query-client';
import { createAppRouter } from './router';

export function createApp(history?: RouterHistory) {
  const queryClient = createQueryClient(sendToLogin);
  const router = createAppRouter(queryClient, history);

  function sendToLogin() {
    queryClient.setQueryData(sessionQueryOptions.queryKey, null);
    const { pathname, href } = router.state.location;
    if (pathname !== '/login') void router.navigate({ to: '/login', search: { redirect: href } });
  }

  return { queryClient, router };
}

export function App({ app }: { app: ReturnType<typeof createApp> }) {
  return (
    <QueryClientProvider client={app.queryClient}>
      <RouterProvider router={app.router} />
    </QueryClientProvider>
  );
}
