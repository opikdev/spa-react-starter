import { useState } from 'react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { errorMessage } from '@/lib/api/problem';
import type { Note } from '../api';
import { useDeleteNote } from '../hooks';

export function DeleteNote({ note, onDeleted }: { note: Note; onDeleted: () => void }) {
  const remove = useDeleteNote(note.id);
  const [confirming, setConfirming] = useState(false);

  return (
    <section
      aria-labelledby="delete-note-heading"
      className="space-y-3 border-t border-border pt-6"
    >
      <h2 id="delete-note-heading" className="text-base font-semibold">
        Delete this note
      </h2>
      {remove.isError && <Alert>{errorMessage(remove.error)}</Alert>}
      <Button variant="secondary" onClick={() => setConfirming(true)}>
        Delete note
      </Button>
      <Dialog
        open={confirming}
        onClose={() => setConfirming(false)}
        title="Delete this note?"
        description={`“${note.title}” will be deleted for good. You can’t undo this.`}
      >
        <Button variant="secondary" autoFocus onClick={() => setConfirming(false)}>
          Keep note
        </Button>
        <Button
          variant="destructive"
          disabled={remove.isPending}
          onClick={() =>
            remove.mutate(undefined, {
              onSuccess: onDeleted,
              onSettled: () => setConfirming(false),
            })
          }
        >
          {remove.isPending ? 'Deleting…' : 'Delete note'}
        </Button>
      </Dialog>
    </section>
  );
}
