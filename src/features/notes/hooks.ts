import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createNote,
  deleteNote,
  type NoteInput,
  noteQueryOptions,
  notesQueryOptions,
  updateNote,
} from './api';

export function useCreateNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ input, idempotencyKey }: { input: NoteInput; idempotencyKey: string }) =>
      createNote(input, idempotencyKey),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notesQueryOptions.queryKey }),
  });
}

export function useUpdateNote(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ input, etag }: { input: NoteInput; etag: string }) =>
      updateNote(id, input, etag),
    onSuccess: (saved) => {
      queryClient.setQueryData(noteQueryOptions(id).queryKey, saved);
      return queryClient.invalidateQueries({ queryKey: notesQueryOptions.queryKey });
    },
  });
}

export function useDeleteNote(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => deleteNote(id),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: noteQueryOptions(id).queryKey });
      return queryClient.invalidateQueries({ queryKey: notesQueryOptions.queryKey });
    },
  });
}
