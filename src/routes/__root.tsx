import { type QueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { createRootRouteWithContext, Link, Outlet, useRouter } from '@tanstack/react-router';
import { useEffect } from 'react';
import { RouteError } from '@/components/route-states';
import { LogoutButton, sessionQueryOptions } from '@/features/auth';

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  beforeLoad: ({ context }) => context.queryClient.ensureQueryData(sessionQueryOptions),
  component: RootLayout,
  errorComponent: (props) => (
    <main id="main" className="mx-auto max-w-2xl px-4 py-10">
      <RouteError {...props} />
    </main>
  ),
});

const navLink = 'text-sm font-medium underline-offset-4 hover:underline';

function RootLayout() {
  const { data: user } = useSuspenseQuery(sessionQueryOptions);
  const router = useRouter();

  useEffect(
    () =>
      router.subscribe('onRendered', (event) => {
        if (event.fromLocation && event.pathChanged) {
          document.querySelector<HTMLElement>('main h1')?.focus();
        }
      }),
    [router],
  );

  return (
    <>
      <a
        href="#main"
        className="sr-only rounded-md bg-background px-4 py-2 focus:not-sr-only focus:absolute focus:top-2 focus:left-2"
      >
        Skip to main content
      </a>
      <header className="border-b border-border">
        <nav
          aria-label="Main"
          className="mx-auto flex min-h-16 max-w-2xl flex-wrap items-center justify-between gap-4 px-4 py-2"
        >
          <Link to="/notes" className="text-lg font-semibold tracking-tight">
            Notes
          </Link>
          {user ? (
            <div className="flex items-center gap-4">
              <span className="hidden text-sm text-muted-foreground sm:inline">{user.email}</span>
              <LogoutButton />
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Link to="/login" className={navLink}>
                Log in
              </Link>
              <Link to="/register" className={navLink}>
                Create account
              </Link>
            </div>
          )}
        </nav>
      </header>
      <main id="main" className="mx-auto max-w-2xl px-4 py-10">
        <Outlet />
      </main>
    </>
  );
}
