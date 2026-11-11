import { HttpResponse, http } from 'msw';
import { addNote, addUser, db, now } from './db';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function headers(extra: Record<string, string> = {}): Headers {
  return new Headers({ 'X-Request-Id': `req_${crypto.randomUUID().slice(0, 8)}`, ...extra });
}

function problem(
  status: number,
  type: string,
  detail: string,
  errors?: { field: string; detail: string }[],
) {
  return HttpResponse.json(
    { type: `urn:problem:${type}`, title: type, status, detail, instance: '', errors },
    { status, headers: headers({ 'Content-Type': 'application/problem+json' }) },
  );
}

function stripOwner<T extends { userId: string }>({ userId: _, ...rest }: T) {
  return rest;
}

function currentUser() {
  return [...db.users.values()].find((user) => user.id === db.currentUserId) ?? null;
}

function ownNote(id: string) {
  const note = db.notes.get(id);
  return note && note.userId === db.currentUserId ? note : null;
}

function validateNote(body: { title?: unknown; body?: unknown }, partial: boolean) {
  const errors: { field: string; detail: string }[] = [];
  if (!(partial && body.title === undefined)) {
    if (typeof body.title !== 'string' || body.title.length < 1 || body.title.length > 200) {
      errors.push({ field: 'title', detail: 'Must be 1 to 200 characters' });
    }
  }
  if (body.body !== undefined && (typeof body.body !== 'string' || body.body.length > 10_000)) {
    errors.push({ field: 'body', detail: 'Must be at most 10000 characters' });
  }
  return errors;
}

const unauthorized = () => problem(401, 'unauthorized', 'Log in to continue.');
const notFound = (id: string) => problem(404, 'not-found', `Note ${id} does not exist.`);
const invalid = (errors: { field: string; detail: string }[]) =>
  problem(400, 'validation-failed', 'The request has invalid fields.', errors);

export const handlers = [
  http.post('/api/v1/users', async ({ request }) => {
    const { email, password } = (await request.json()) as { email: string; password: string };
    const errors = [];
    if (!emailPattern.test(email)) errors.push({ field: 'email', detail: 'Invalid email address' });
    if (password.length < 12 || password.length > 128) {
      errors.push({ field: 'password', detail: 'Must be 12 to 128 characters' });
    }
    if (errors.length > 0) return invalid(errors);
    if (db.users.has(email)) return problem(409, 'email-taken', `${email} is already registered.`);
    return HttpResponse.json(addUser(email, password), { status: 201, headers: headers() });
  }),

  http.post('/api/v1/sessions', async ({ request }) => {
    const { email, password } = (await request.json()) as { email: string; password: string };
    const user = db.users.get(email);
    if (!user || user.password !== password) {
      return problem(401, 'invalid-credentials', 'The email or password is wrong.');
    }
    db.currentUserId = user.id;
    return HttpResponse.json(
      { expiresAt: new Date(Date.now() + 7 * 86_400_000).toISOString() },
      { status: 201, headers: headers() },
    );
  }),

  http.delete('/api/v1/sessions/current', () => {
    if (!currentUser()) return unauthorized();
    db.currentUserId = null;
    return new HttpResponse(null, { status: 204, headers: headers() });
  }),

  http.get('/api/v1/users/me', () => {
    const user = currentUser();
    if (!user) return unauthorized();
    const { password: _, ...publicUser } = user;
    return HttpResponse.json(publicUser, { headers: headers() });
  }),

  http.get('/api/v1/notes', ({ request }) => {
    if (!currentUser()) return unauthorized();
    const url = new URL(request.url);
    const limit = Number(url.searchParams.get('limit') ?? 20);
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      return invalid([{ field: 'limit', detail: 'Must be 1 to 100' }]);
    }
    const notes = [...db.notes.values()]
      .filter((note) => note.userId === db.currentUserId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const cursor = url.searchParams.get('cursor');
    const start = cursor ? notes.findIndex((note) => note.id === cursor) + 1 : 0;
    const page = notes.slice(start, start + limit);
    const nextCursor = start + limit < notes.length ? (page.at(-1)?.id ?? null) : null;
    return HttpResponse.json(
      { data: page.map(stripOwner), meta: { limit, nextCursor } },
      { headers: headers() },
    );
  }),

  http.post('/api/v1/notes', async ({ request }) => {
    const user = currentUser();
    if (!user) return unauthorized();
    const text = await request.text();
    const key = request.headers.get('Idempotency-Key');
    const replay = key ? db.replays.get(`${user.id}:${key}`) : undefined;
    if (replay) {
      if (replay.body !== text) {
        return problem(422, 'idempotency-key-reused', 'This key was used with a different body.');
      }
      return HttpResponse.json(replay.note, {
        status: 201,
        headers: headers({ ETag: `"${replay.note.version}"`, 'Idempotency-Replayed': 'true' }),
      });
    }
    const body = JSON.parse(text) as { title: string; body?: string };
    const errors = validateNote(body, false);
    if (errors.length > 0) return invalid(errors);
    const note = addNote(user.id, body.title, body.body);
    if (key) db.replays.set(`${user.id}:${key}`, { body: text, note });
    return HttpResponse.json(note, {
      status: 201,
      headers: headers({ ETag: `"${note.version}"`, Location: `/v1/notes/${note.id}` }),
    });
  }),

  http.get('/api/v1/notes/:id', ({ params }) => {
    if (!currentUser()) return unauthorized();
    const id = String(params.id);
    const note = ownNote(id);
    if (!note) return notFound(id);
    return HttpResponse.json(stripOwner(note), { headers: headers({ ETag: `"${note.version}"` }) });
  }),

  http.patch('/api/v1/notes/:id', async ({ params, request }) => {
    if (!currentUser()) return unauthorized();
    const id = String(params.id);
    const note = ownNote(id);
    if (!note) return notFound(id);
    const ifMatch = request.headers.get('If-Match');
    if (!ifMatch) return problem(428, 'precondition-required', 'Send If-Match with the ETag.');
    if (ifMatch !== `"${note.version}"`) {
      return problem(412, 'version-mismatch', `Note ${id} has changed. Fetch it and retry.`);
    }
    const body = (await request.json()) as { title?: string; body?: string };
    const errors = validateNote(body, true);
    if (errors.length > 0) return invalid(errors);
    const updated = { ...note, ...body, version: note.version + 1, updatedAt: now() };
    db.notes.set(id, updated);
    return HttpResponse.json(stripOwner(updated), {
      headers: headers({ ETag: `"${updated.version}"` }),
    });
  }),

  http.delete('/api/v1/notes/:id', ({ params }) => {
    if (!currentUser()) return unauthorized();
    const id = String(params.id);
    if (!ownNote(id)) return notFound(id);
    db.notes.delete(id);
    return new HttpResponse(null, { status: 204, headers: headers() });
  }),
];
