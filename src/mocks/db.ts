import type { components } from '@/lib/api/schema';

type User = components['schemas']['User'];
type Note = components['schemas']['Note'];

export const demoUser = { email: 'demo@example.com', password: 'demo-password-123' };

type State = {
  users: Map<string, User & { password: string }>;
  notes: Map<string, Note & { userId: string }>;
  replays: Map<string, { body: string; note: Note }>;
  currentUserId: string | null;
  clock: number;
};

export const db: State = {
  users: new Map(),
  notes: new Map(),
  replays: new Map(),
  currentUserId: null,
  clock: 0,
};

export function nextId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().replaceAll('-', '')}`;
}

export function now(): string {
  db.clock += 1;
  return new Date(Date.UTC(2026, 10, 1) + db.clock * 60_000).toISOString();
}

export function addUser(email: string, password: string): User {
  const user = { id: nextId('usr'), email, createdAt: now() };
  db.users.set(email, { ...user, password });
  return user;
}

export function addNote(userId: string, title: string, body = ''): Note {
  const timestamp = now();
  const note = {
    id: nextId('note'),
    title,
    body,
    version: 1,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  db.notes.set(note.id, { ...note, userId });
  return note;
}

export function resetDb(): void {
  db.users.clear();
  db.notes.clear();
  db.replays.clear();
  db.currentUserId = null;
  db.clock = 0;
  const user = addUser(demoUser.email, demoUser.password);
  addNote(user.id, 'Welcome to your notes', 'Edit or delete this note, or write a new one.');
  addNote(user.id, 'Launch checklist', 'Point API_UPSTREAM at your API, then deploy the image.');
}

resetDb();
