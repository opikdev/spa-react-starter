import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { PageHeading } from '@/components/page-heading';
import { CreateNote } from '@/features/notes';

export const Route = createFileRoute('/_authenticated/notes/new')({
  component: NewNotePage,
});

function NewNotePage() {
  const navigate = useNavigate();

  return (
    <section className="space-y-6">
      <PageHeading>New note</PageHeading>
      <CreateNote
        onCreated={(note) => navigate({ to: '/notes/$noteId', params: { noteId: note.id } })}
      />
    </section>
  );
}
