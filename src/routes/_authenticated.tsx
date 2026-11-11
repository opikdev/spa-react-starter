import { createFileRoute, redirect } from '@tanstack/react-router';
import { sessionQueryOptions } from '@/features/auth';

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async ({ context, location }) => {
    if (!(await context.queryClient.ensureQueryData(sessionQueryOptions))) {
      throw redirect({ to: '/login', search: { redirect: location.href } });
    }
  },
});
