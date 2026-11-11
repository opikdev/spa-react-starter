import { createFileRoute, Link } from '@tanstack/react-router';
import { PageHeading } from '@/components/page-heading';
import { buttonVariants } from '@/components/ui/button';
import { NoteList, notesQueryOptions } from '@/features/notes';

export const Route = createFileRoute('/_authenticated/notes/')({
  loader: ({ context }) => context.queryClient.ensureInfiniteQueryData(notesQueryOptions),
  component: NotesPage,
});

function NotesPage() {
  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <PageHeading>Your notes</PageHeading>
        <Link to="/notes/new" className={buttonVariants()}>
          New note
        </Link>
      </div>
      <NoteList />
    </section>
  );
}
