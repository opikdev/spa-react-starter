import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';
import { worker } from '@/mocks/browser';
import { db, demoUser } from '@/mocks/db';
import { logInAsDemo, renderApp } from '../../../test/render';

async function logIn(email: string, password: string) {
  const user = userEvent.setup();
  await user.type(await screen.findByLabelText('Email'), email);
  await user.type(screen.getByLabelText('Password'), password);
  await user.click(screen.getByRole('button', { name: 'Log in' }));
}

describe('logging in', () => {
  it('sends a logged-out visitor to log in, then back to the page they asked for', async () => {
    const app = renderApp('/notes/new');

    await screen.findByRole('heading', { name: 'Log in' });
    expect(app.router.state.location.search).toEqual({ redirect: '/notes/new' });

    await logIn(demoUser.email, demoUser.password);

    expect(await screen.findByRole('heading', { name: 'New note' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Log out' })).toBeVisible();
  });

  it('ignores a redirect to another site', async () => {
    const app = renderApp('/login?redirect=%2F%2Fevil.example%2Fnotes');

    await logIn(demoUser.email, demoUser.password);

    await screen.findByRole('heading', { name: 'Your notes' });
    expect(app.router.state.location.pathname).toBe('/notes');
  });

  it('explains wrong credentials', async () => {
    renderApp('/login');

    await logIn(demoUser.email, 'not-the-password');

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'That email and password don’t match. Check both, then try again.',
    );
  });

  it('checks the fields before calling the API', async () => {
    renderApp('/login');
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Log in' }));

    expect(await screen.findByText('Enter an email address, like name@example.com.')).toBeVisible();
    expect(screen.getByText('Enter your password.')).toBeVisible();
    expect(screen.getByLabelText('Email')).toHaveFocus();
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true');
  });

  it('says when to retry after too many attempts', async () => {
    worker.use(
      http.post('/api/v1/sessions', () =>
        HttpResponse.json(
          { type: 'urn:problem:rate-limited', title: 'Too many requests', status: 429 },
          { status: 429, headers: { 'Retry-After': '30' } },
        ),
      ),
    );
    renderApp('/login');

    await logIn(demoUser.email, demoUser.password);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Too many requests. Try again in 30 seconds.',
    );
  });

  it('skips the form when already logged in', async () => {
    logInAsDemo();
    renderApp('/login?redirect=%2Fnotes%2Fnew');

    expect(await screen.findByRole('heading', { name: 'New note' })).toBeVisible();
  });
});

describe('registering', () => {
  async function register(email: string, password: string) {
    const user = userEvent.setup();
    await user.type(await screen.findByLabelText('Email'), email);
    await user.type(screen.getByLabelText(/^Password/), password);
    await user.click(screen.getByRole('button', { name: 'Create account' }));
  }

  it('creates the account and logs in', async () => {
    renderApp('/register');

    await register('ada@example.com', 'correct-horse-battery');

    expect(await screen.findByRole('heading', { name: 'Your notes' })).toBeVisible();
    expect(screen.getByText('You have no notes yet.', { exact: false })).toBeVisible();
    expect(db.users.has('ada@example.com')).toBe(true);
  });

  it('puts a taken email on the email field', async () => {
    renderApp('/register');

    await register(demoUser.email, 'correct-horse-battery');

    expect(
      await screen.findByText('An account with this email already exists. Log in instead.'),
    ).toBeVisible();
    expect(screen.getByLabelText('Email')).toHaveFocus();
  });

  it('puts the API’s field errors on the fields', async () => {
    worker.use(
      http.post('/api/v1/users', () =>
        HttpResponse.json(
          {
            type: 'urn:problem:validation-failed',
            title: 'Request validation failed',
            status: 400,
            errors: [{ field: 'password', detail: 'Too common. Pick another password.' }],
          },
          { status: 400 },
        ),
      ),
    );
    renderApp('/register');

    await register('ada@example.com', 'password1234');

    expect(await screen.findByText('Too common. Pick another password.')).toBeVisible();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('shows the request ID when the server fails', async () => {
    worker.use(
      http.post('/api/v1/users', () =>
        HttpResponse.json(
          { type: 'urn:problem:internal-error', title: 'Internal error', status: 500 },
          { status: 500, headers: { 'X-Request-Id': 'req_abc' } },
        ),
      ),
    );
    renderApp('/register');

    await register('ada@example.com', 'correct-horse-battery');

    expect(await screen.findByRole('alert')).toMatchTextContent(/quote request ID req_abc\./);
  });
});

describe('logging out', () => {
  it('ends the session and clears cached data', async () => {
    logInAsDemo();
    const app = renderApp('/notes');
    const user = userEvent.setup();

    await screen.findByText('Launch checklist');
    await user.click(screen.getByRole('button', { name: 'Log out' }));

    await screen.findByRole('heading', { name: 'Log in' });
    expect(db.currentUserId).toBeNull();
    expect(app.queryClient.getQueryData(['notes', 'list'])).toBeUndefined();
    expect(screen.getByRole('link', { name: 'Create account' })).toBeVisible();
  });

  it('keeps the session when logging out fails', async () => {
    logInAsDemo();
    worker.use(http.delete('/api/v1/sessions/current', () => HttpResponse.error()));
    renderApp('/notes');
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Log out' }));

    expect(await screen.findByRole('alert', {}, { timeout: 5000 })).toMatchTextContent(
      /^Can’t reach the server\./,
    );
    expect(screen.getByRole('heading', { name: 'Your notes' })).toBeVisible();
  });

  it('sends the user to log in when the session expires', async () => {
    logInAsDemo();
    const app = renderApp('/notes');
    await screen.findByText('Launch checklist');
    db.currentUserId = null;
    const user = userEvent.setup();

    await user.click(screen.getByRole('link', { name: 'Launch checklist' }));

    await screen.findByRole('heading', { name: 'Log in' });
    await waitFor(() =>
      expect(app.router.state.location.search).toEqual({
        redirect: expect.stringMatching(/^\/notes\/note_/),
      }),
    );
  });
});
