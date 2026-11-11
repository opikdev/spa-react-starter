import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Alert } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { errorMessage, isProblem, problemTypes } from '@/lib/api/problem';
import { setServerFieldErrors } from '@/lib/form';
import { type NoteInput, noteQueryOptions } from '../api';
import { useUpdateNote } from '../hooks';
import { noteSchema } from '../schema';
import { DeleteNote } from './delete-note';
import { NoteFields, noteFields } from './note-fields';

export function EditNote({ noteId, onDeleted }: { noteId: string; onDeleted: () => void }) {
  'use no memo';
  const queryClient = useQueryClient();
  const { data } = useSuspenseQuery(noteQueryOptions(noteId));
  const update = useUpdateNote(noteId);
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [conflict, setConflict] = useState(false);
  const form = useForm<NoteInput>({
    resolver: zodResolver(noteSchema),
    defaultValues: { title: data.note.title, body: data.note.body },
  });

  function save(input: NoteInput, etag: string) {
    setFormError(null);
    setSaved(false);
    update.mutate(
      { input, etag },
      {
        onSuccess: ({ note }) => {
          form.reset({ title: note.title, body: note.body }, { keepFieldsRef: true });
          setSaved(true);
        },
        onError: (error) => {
          if (isProblem(error, problemTypes.versionMismatch)) {
            setConflict(true);
          } else if (!setServerFieldErrors(error, noteFields, form.setError)) {
            setFormError(errorMessage(error));
          }
        },
      },
    );
  }

  async function resolveConflict(keep: 'latest' | 'mine') {
    setConflict(false);
    try {
      const latest = await queryClient.fetchQuery({ ...noteQueryOptions(noteId), staleTime: 0 });
      if (keep === 'latest') {
        form.reset({ title: latest.note.title, body: latest.note.body }, { keepFieldsRef: true });
      } else {
        save(form.getValues(), latest.etag);
      }
    } catch (error) {
      setFormError(errorMessage(error));
    }
  }

  return (
    <div className="space-y-8">
      <form
        onSubmit={form.handleSubmit((input) => save(input, data.etag))}
        noValidate
        className="space-y-5"
      >
        {formError && <Alert variant="destructive">{formError}</Alert>}
        <NoteFields form={form} />
        <div className="flex flex-wrap items-center gap-4">
          <Button type="submit" disabled={update.isPending}>
            {update.isPending ? 'Saving…' : 'Save changes'}
          </Button>
          <p role="status" className="text-sm text-muted-foreground">
            {saved && !form.formState.isDirty ? 'Changes saved.' : ''}
          </p>
        </div>
      </form>
      <DeleteNote note={data.note} onDeleted={onDeleted} />
      <AlertDialog open={conflict} onOpenChange={setConflict}>
        <AlertDialogContent className="data-[size=default]:sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>This note changed while you were editing</AlertDialogTitle>
            <AlertDialogDescription>
              Someone saved a newer version. Load it to see their changes, which discards your
              edits, or save your version over theirs.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => setConflict(false)}>
              Keep editing
            </Button>
            <Button variant="outline" onClick={() => resolveConflict('latest')}>
              Load latest version
            </Button>
            <Button variant="destructive" onClick={() => resolveConflict('mine')}>
              Overwrite with my edits
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
