import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { worker } from '@/mocks/browser';
import { addNote, db } from '@/mocks/db';
import { logInAsDemo, renderApp } from '../../../test/render';

function demoUserId(): string {
  return db.currentUserId as string;
}

function noteTitled(title: string) {
  return [...db.notes.values()].find((note) => note.title === title);
}

beforeEach(() => {
  logInAsDemo();
});

describe('notes list', () => {
  it('shows the newest notes first', async () => {
    renderApp('/notes');

    const list = await screen.findByRole('list');
    const links = within(list).getAllByRole('link');
    expect(links.map((link) => link.textContent)).toEqual([
      'Launch checklist',
      'Welcome to your notes',
    ]);
    expect(screen.getByRole('status')).toHaveTextContent('Showing 2 notes');
  });

  it('guides a new user to write a note', async () => {
    db.notes.clear();
    renderApp('/notes');

    expect(await screen.findByText(/You have no notes yet/)).toBeVisible();
    expect(screen.getByRole('link', { name: 'New note' })).toBeVisible();
  });

  it('loads more notes with the cursor', async () => {
    for (let index = 1; index <= 25; index += 1) addNote(demoUserId(), `Extra ${index}`);
    renderApp('/notes');
    const user = userEvent.setup();

    expect(await screen.findByText('Showing 20 notes')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Load more notes' }));

    expect(await screen.findByText('Showing 27 notes')).toBeVisible();
    expect(screen.getByRole('link', { name: 'Welcome to your notes' })).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Load more notes' })).toBeNull();
  });

  it('keeps the loaded notes when the next page fails', async () => {
    for (let index = 1; index <= 25; index += 1) addNote(demoUserId(), `Extra ${index}`);
    renderApp('/notes');
    const user = userEvent.setup();
    await screen.findByText('Showing 20 notes');
    worker.use(
      http.get('/api/v1/notes', () =>
        HttpResponse.json(
          { type: 'urn:problem:service-unavailable', title: 'Unavailable', status: 503 },
          { status: 503, headers: { 'X-Request-Id': 'req_page' } },
        ),
      ),
    );

    await user.click(screen.getByRole('button', { name: 'Load more notes' }));

    expect(await screen.findByRole('alert')).toMatchTextContent(/request ID req_page/);
    expect(screen.getByText('Showing 20 notes')).toBeVisible();
  });

  it('shows an error with a way to retry when the list fails', async () => {
    worker.use(
      http.get(
        '/api/v1/notes',
        () =>
          HttpResponse.json(
            { type: 'urn:problem:internal-error', title: 'Internal error', status: 500 },
            { status: 500, headers: { 'X-Request-Id': 'req_list' } },
          ),
        { once: true },
      ),
    );
    renderApp('/notes');
    const user = userEvent.setup();

    expect(await screen.findByRole('heading', { name: 'This page didn’t load' })).toBeVisible();
    expect(screen.getByText(/quote request ID req_list/)).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByRole('heading', { name: 'Your notes' })).toBeVisible();
  });
});

describe('creating a note', () => {
  it('saves the note and opens it', async () => {
    const keys: (string | null)[] = [];
    worker.events.on('request:start', ({ request }) => {
      if (request.method === 'POST') keys.push(request.headers.get('Idempotency-Key'));
    });
    renderApp('/notes/new');
    const user = userEvent.setup();

    await user.type(await screen.findByLabelText('Title'), 'Groceries');
    await user.type(screen.getByLabelText('Note'), 'Milk');
    await user.click(screen.getByRole('button', { name: 'Save note' }));

    expect(await screen.findByRole('heading', { name: 'Edit note' })).toBeVisible();
    expect(screen.getByLabelText('Title')).toHaveValue('Groceries');
    expect(keys).toEqual([expect.stringMatching(/^[0-9a-f-]{36}$/)]);
    worker.events.removeAllListeners();
  });

  it('reuses the idempotency key when the user retries the same note', async () => {
    const keys: (string | null)[] = [];
    worker.use(
      http.post(
        '/api/v1/notes',
        ({ request }) => {
          keys.push(request.headers.get('Idempotency-Key'));
          return HttpResponse.json(
            { type: 'urn:problem:internal-error', title: 'Internal error', status: 500 },
            { status: 500, headers: { 'X-Request-Id': 'req_create' } },
          );
        },
        { once: true },
      ),
    );
    worker.events.on('request:start', ({ request }) => {
      if (request.method === 'POST' && keys.length === 1) {
        keys.push(request.headers.get('Idempotency-Key'));
      }
    });
    renderApp('/notes/new');
    const user = userEvent.setup();

    await user.type(await screen.findByLabelText('Title'), 'Groceries');
    await user.click(screen.getByRole('button', { name: 'Save note' }));
    expect(await screen.findByRole('alert')).toMatchTextContent(/quote request ID req_create/);
    await user.click(screen.getByRole('button', { name: 'Save note' }));

    expect(await screen.findByRole('heading', { name: 'Edit note' })).toBeVisible();
    expect(keys).toHaveLength(2);
    expect(keys[1]).toBe(keys[0]);
    worker.events.removeAllListeners();
  });

  it('checks the title before saving', async () => {
    renderApp('/notes/new');
    const user = userEvent.setup();

    await user.type(await screen.findByLabelText('Title'), '   ');
    await user.click(screen.getByRole('button', { name: 'Save note' }));

    expect(await screen.findByText('Give the note a title.')).toBeVisible();
    expect(screen.getByLabelText('Title')).toHaveFocus();
  });

  it('puts the API’s field errors on the fields', async () => {
    worker.use(
      http.post('/api/v1/notes', () =>
        HttpResponse.json(
          {
            type: 'urn:problem:validation-failed',
            title: 'Request validation failed',
            status: 400,
            errors: [{ field: 'body', detail: 'Contains a blocked word' }],
          },
          { status: 400 },
        ),
      ),
    );
    renderApp('/notes/new');
    const user = userEvent.setup();

    await user.type(await screen.findByLabelText('Title'), 'Groceries');
    await user.click(screen.getByRole('button', { name: 'Save note' }));

    expect(await screen.findByText('Contains a blocked word')).toBeVisible();
    expect(screen.getByLabelText('Note')).toHaveFocus();
  });
});

describe('editing a note', () => {
  async function openNote(title: string) {
    const note = noteTitled(title);
    renderApp(`/notes/${note?.id}`);
    return screen.findByLabelText('Title');
  }

  it('saves changes with the note’s ETag', async () => {
    const user = userEvent.setup();
    const title = await openNote('Launch checklist');

    await user.clear(title);
    await user.type(title, 'Launch plan');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(await screen.findByText('Changes saved.')).toBeVisible();
    expect(noteTitled('Launch plan')?.version).toBe(2);

    await user.type(screen.getByLabelText('Title'), ' v2');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => expect(noteTitled('Launch plan v2')?.version).toBe(3));
  });

  it('offers to load the latest version after a conflict', async () => {
    const user = userEvent.setup();
    const title = await openNote('Launch checklist');
    await user.type(title, '!');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));
    await screen.findByText('Changes saved.');
    const stored = noteTitled('Launch checklist!');
    if (stored) db.notes.set(stored.id, { ...stored, title: 'Their title', version: 3 });

    await user.clear(title);
    await user.type(title, 'My title');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));
    const dialog = await screen.findByRole('alertdialog', {
      name: 'This note changed while you were editing',
    });
    await user.click(within(dialog).getByRole('button', { name: 'Load latest version' }));

    await waitFor(() => expect(screen.getByLabelText('Title')).toHaveValue('Their title'));
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());
  });

  it('overwrites the latest version when the user chooses to', async () => {
    const user = userEvent.setup();
    const title = await openNote('Launch checklist');
    const stored = noteTitled('Launch checklist');
    if (stored) db.notes.set(stored.id, { ...stored, title: 'Their title', version: 2 });

    await user.clear(title);
    await user.type(title, 'My title');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));
    await user.click(await screen.findByRole('button', { name: 'Overwrite with my edits' }));

    expect(await screen.findByText('Changes saved.')).toBeVisible();
    expect(noteTitled('My title')?.version).toBe(3);
  });

  it('keeps the edits when the user closes the conflict dialog', async () => {
    const user = userEvent.setup();
    const title = await openNote('Launch checklist');
    const stored = noteTitled('Launch checklist');
    if (stored) db.notes.set(stored.id, { ...stored, version: 2 });

    await user.clear(title);
    await user.type(title, 'My title');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));
    await user.click(await screen.findByRole('button', { name: 'Keep editing' }));

    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());
    expect(screen.getByLabelText('Title')).toHaveValue('My title');
  });

  it('shows why loading the latest version failed', async () => {
    const user = userEvent.setup();
    const title = await openNote('Launch checklist');
    const stored = noteTitled('Launch checklist');
    if (stored) db.notes.set(stored.id, { ...stored, version: 2 });

    await user.type(title, '!');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));
    worker.use(
      http.get('/api/v1/notes/:id', () =>
        HttpResponse.json(
          { type: 'urn:problem:internal-error', title: 'Internal error', status: 500 },
          { status: 500, headers: { 'X-Request-Id': 'req_latest' } },
        ),
      ),
    );
    await user.click(await screen.findByRole('button', { name: 'Load latest version' }));

    expect(await screen.findByRole('alert')).toMatchTextContent(/request ID req_latest/);
  });

  it('shows a not found page for a missing note', async () => {
    renderApp('/notes/note_missing');

    expect(await screen.findByRole('heading', { name: 'Note not found' })).toBeVisible();
    expect(screen.getByRole('link', { name: 'Back to your notes' })).toBeVisible();
  });
});

describe('deleting a note', () => {
  it('asks first, then deletes the note', async () => {
    const note = noteTitled('Launch checklist');
    renderApp(`/notes/${note?.id}`);
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Delete note' }));
    const dialog = await screen.findByRole('alertdialog', { name: 'Delete this note?' });
    await waitFor(() =>
      expect(within(dialog).getByRole('button', { name: 'Keep note' })).toHaveFocus(),
    );
    await user.click(within(dialog).getByRole('button', { name: 'Delete note' }));

    expect(await screen.findByRole('heading', { name: 'Your notes' })).toBeVisible();
    expect(screen.queryByRole('link', { name: 'Launch checklist' })).toBeNull();
    expect(noteTitled('Launch checklist')).toBeUndefined();
  });

  it('keeps the note when the user changes their mind', async () => {
    const note = noteTitled('Launch checklist');
    renderApp(`/notes/${note?.id}`);
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Delete note' }));
    await user.click(await screen.findByRole('button', { name: 'Keep note' }));

    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());
    expect(noteTitled('Launch checklist')).toBeDefined();
  });

  it('explains a failed delete', async () => {
    worker.use(
      http.delete('/api/v1/notes/:id', () =>
        HttpResponse.json(
          { type: 'urn:problem:rate-limited', title: 'Too many requests', status: 429 },
          { status: 429, headers: { 'Retry-After': '5' } },
        ),
      ),
    );
    const note = noteTitled('Launch checklist');
    renderApp(`/notes/${note?.id}`);
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Delete note' }));
    const dialog = await screen.findByRole('alertdialog');
    await user.click(within(dialog).getByRole('button', { name: 'Delete note' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Too many requests. Try again in 5 seconds.',
    );
  });
});
