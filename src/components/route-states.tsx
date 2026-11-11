import { useQueryErrorResetBoundary } from '@tanstack/react-query';
import { type ErrorComponentProps, Link, useRouter } from '@tanstack/react-router';
import { useEffect } from 'react';
import { errorMessage } from '@/lib/api/problem';
import { reportError } from '@/lib/reporting';
import { PageHeading } from './page-heading';
import { Button } from './ui/button';

export function PendingView() {
  return (
    <div role="status" className="py-12 text-muted-foreground">
      Loading…
    </div>
  );
}

export function RouteError({ error, reset }: ErrorComponentProps) {
  const router = useRouter();
  const queryErrorBoundary = useQueryErrorResetBoundary();

  useEffect(() => {
    reportError(error, { path: router.state.location.pathname });
    queryErrorBoundary.reset();
  }, [error, router, queryErrorBoundary]);

  return (
    <section className="space-y-4">
      <PageHeading>This page didn’t load</PageHeading>
      <p>{errorMessage(error)}</p>
      <Button
        variant="outline"
        onClick={() => {
          reset();
          void router.invalidate();
        }}
      >
        Try again
      </Button>
    </section>
  );
}

export function NotFound() {
  return (
    <section className="space-y-4">
      <PageHeading>Page not found</PageHeading>
      <p>The address may be mistyped, or the page was moved or deleted.</p>
      <Link to="/notes" className="text-primary underline underline-offset-4 hover:no-underline">
        Go to your notes
      </Link>
    </section>
  );
}
