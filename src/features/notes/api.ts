import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { request } from '@/lib/api/request';
import type { components } from '@/lib/api/schema';

export type Note = components['schemas']['Note'];
export type NoteInput = { title: string; body: string };
export type VersionedNote = { note: Note; etag: string };

export const pageSize = 20;

export const notesQueryKey = ['notes'] as const;

export const notesQueryOptions = infiniteQueryOptions({
  queryKey: [...notesQueryKey, 'list'],
  queryFn: async ({ pageParam }) => {
    const query = pageParam ? { limit: pageSize, cursor: pageParam } : { limit: pageSize };
    return (await request(api.GET('/v1/notes', { params: { query } }))).data;
  },
  initialPageParam: '',
  getNextPageParam: (page) => page.meta.nextCursor ?? undefined,
});

export function noteQueryOptions(id: string) {
  return queryOptions({
    queryKey: [...notesQueryKey, 'detail', id],
    queryFn: async () =>
      versioned(await request(api.GET('/v1/notes/{id}', { params: { path: { id } } }))),
  });
}

function versioned({ data, response }: { data: Note; response: Response }): VersionedNote {
  const etag = response.headers.get('ETag');
  if (!etag) throw new Error(`The API sent note ${data.id} without an ETag`);
  return { note: data, etag };
}

export async function createNote(input: NoteInput, idempotencyKey: string): Promise<Note> {
  const { data } = await request(
    api.POST('/v1/notes', {
      body: input,
      params: { header: { 'idempotency-key': idempotencyKey } },
    }),
  );
  return data;
}

export async function updateNote(
  id: string,
  input: NoteInput,
  etag: string,
): Promise<VersionedNote> {
  return versioned(
    await request(
      api.PATCH('/v1/notes/{id}', {
        body: input,
        params: { path: { id }, header: { 'if-match': etag } },
      }),
    ),
  );
}

export async function deleteNote(id: string): Promise<void> {
  await request(api.DELETE('/v1/notes/{id}', { params: { path: { id } } }));
}
