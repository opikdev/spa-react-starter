import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { errorMessage } from '@/lib/api/problem';
import { notesQueryOptions } from '../api';

const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' });

export function NoteList() {
  const { data, hasNextPage, fetchNextPage, isFetchingNextPage, error, isFetchNextPageError } =
    useSuspenseInfiniteQuery(notesQueryOptions);
  const notes = data.pages.flatMap((page) => page.data);

  if (notes.length === 0) {
    return (
      <p className="border-y border-border py-10">
        You have no notes yet. Select <strong>New note</strong> to write your first one.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <ul className="divide-y divide-border border-y border-border">
        {notes.map((note) => (
          <li key={note.id} className="py-4">
            <Link
              to="/notes/$noteId"
              params={{ noteId: note.id }}
              className="font-medium break-words text-primary underline-offset-4 hover:underline"
            >
              {note.title}
            </Link>
            <p className="text-sm text-muted-foreground">
              Updated{' '}
              <time dateTime={note.updatedAt}>{dateFormat.format(new Date(note.updatedAt))}</time>
            </p>
            {note.body && <p className="mt-1 line-clamp-2 break-words">{note.body}</p>}
          </li>
        ))}
      </ul>
      <p role="status" className="text-sm text-muted-foreground">
        Showing {notes.length} {notes.length === 1 ? 'note' : 'notes'}
      </p>
      {isFetchNextPageError && <Alert>{errorMessage(error)}</Alert>}
      {hasNextPage && (
        <Button variant="secondary" disabled={isFetchingNextPage} onClick={() => fetchNextPage()}>
          {isFetchingNextPage ? 'Loading…' : 'Load more notes'}
        </Button>
      )}
    </div>
  );
}
