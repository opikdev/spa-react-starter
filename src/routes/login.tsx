import { createFileRoute, Link, redirect, useNavigate } from '@tanstack/react-router';
import { z } from 'zod/mini';
import { PageHeading } from '@/components/page-heading';
import { isInternalPath, LoginForm, sessionQueryOptions } from '@/features/auth';

const searchSchema = z.object({
  redirect: z.catch(z.optional(z.string().check(z.refine(isInternalPath))), undefined),
});

export const Route = createFileRoute('/login')({
  validateSearch: searchSchema,
  beforeLoad: async ({ context, search }) => {
    if (await context.queryClient.ensureQueryData(sessionQueryOptions)) {
      throw redirect({ href: search.redirect ?? '/notes' });
    }
  },
  component: LoginPage,
});

function LoginPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();

  return (
    <section className="mx-auto max-w-sm space-y-6">
      <PageHeading>Log in</PageHeading>
      <LoginForm onSuccess={() => navigate({ href: search.redirect ?? '/notes', replace: true })} />
      <p className="text-sm">
        New here?{' '}
        <Link
          to="/register"
          className="text-primary underline underline-offset-4 hover:no-underline"
        >
          Create an account
        </Link>
      </p>
    </section>
  );
}
