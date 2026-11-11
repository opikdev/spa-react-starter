import { createFileRoute, Link, redirect, useNavigate } from '@tanstack/react-router';
import { PageHeading } from '@/components/page-heading';
import { RegisterForm, sessionQueryOptions } from '@/features/auth';

export const Route = createFileRoute('/register')({
  beforeLoad: async ({ context }) => {
    if (await context.queryClient.ensureQueryData(sessionQueryOptions)) {
      throw redirect({ to: '/notes' });
    }
  },
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();

  return (
    <section className="mx-auto max-w-sm space-y-6">
      <PageHeading>Create your account</PageHeading>
      <RegisterForm onSuccess={() => navigate({ to: '/notes', replace: true })} />
      <p className="text-sm">
        Already have an account?{' '}
        <Link to="/login" className="text-primary underline underline-offset-4 hover:no-underline">
          Log in
        </Link>
      </p>
    </section>
  );
}
