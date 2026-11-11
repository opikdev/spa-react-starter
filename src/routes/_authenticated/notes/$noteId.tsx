import { createFileRoute, Link, notFound, useNavigate } from '@tanstack/react-router';
import { PageHeading } from '@/components/page-heading';
import { EditNote, noteQueryOptions } from '@/features/notes';
import { isProblem, problemTypes } from '@/lib/api/problem';

export const Route = createFileRoute('/_authenticated/notes/$noteId')({
  loader: async ({ context, params }) => {
    try {
      await context.queryClient.ensureQueryData(noteQueryOptions(params.noteId));
    } catch (error) {
      throw isProblem(error, problemTypes.notFound) ? notFound() : error;
    }
  },
  component: NotePage,
  notFoundComponent: NoteNotFound,
});

function NotePage() {
  const { noteId } = Route.useParams();
  const navigate = useNavigate();

  return (
    <section className="space-y-6">
      <PageHeading>Edit note</PageHeading>
      <EditNote noteId={noteId} onDeleted={() => navigate({ to: '/notes', replace: true })} />
    </section>
  );
}

function NoteNotFound() {
  return (
    <section className="space-y-4">
      <PageHeading>Note not found</PageHeading>
      <p>This note doesn’t exist, or it was deleted.</p>
      <Link to="/notes" className="text-primary underline underline-offset-4 hover:no-underline">
        Back to your notes
      </Link>
    </section>
  );
}
