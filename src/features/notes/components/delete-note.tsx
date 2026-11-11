import { useState } from 'react';
import { Alert } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
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
      {remove.isError && <Alert variant="destructive">{errorMessage(remove.error)}</Alert>}
      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogTrigger render={<Button variant="outline" />}>Delete note</AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this note?</AlertDialogTitle>
            <AlertDialogDescription>
              {`“${note.title}” will be deleted for good. You can’t undo this.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep note</AlertDialogCancel>
            <AlertDialogAction
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
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
