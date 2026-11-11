import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { errorMessage } from '@/lib/api/problem';
import { setServerFieldErrors } from '@/lib/form';
import { useIdempotencyKey } from '@/lib/idempotency';
import type { Note, NoteInput } from '../api';
import { useCreateNote } from '../hooks';
import { noteSchema } from '../schema';
import { NoteFields, noteFields } from './note-fields';

export function CreateNote({ onCreated }: { onCreated: (note: Note) => void }) {
  'use no memo';
  const create = useCreateNote();
  const idempotency = useIdempotencyKey();
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<NoteInput>({
    resolver: zodResolver(noteSchema),
    defaultValues: { title: '', body: '' },
  });

  const submit = form.handleSubmit((input) => {
    setFormError(null);
    create.mutate(
      { input, idempotencyKey: idempotency.keyFor(input) },
      {
        onSuccess: (note) => {
          idempotency.reset();
          onCreated(note);
        },
        onError: (error) => {
          if (!setServerFieldErrors(error, noteFields, form.setError)) {
            setFormError(errorMessage(error));
          }
        },
      },
    );
  });

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      {formError && <Alert>{formError}</Alert>}
      <NoteFields form={form} />
      <Button type="submit" disabled={create.isPending}>
        {create.isPending ? 'Saving…' : 'Save note'}
      </Button>
    </form>
  );
}
