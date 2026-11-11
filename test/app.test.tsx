import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';
import { expect, it } from 'vitest';
import { worker } from '@/mocks/browser';
import { logInAsDemo, renderApp } from './render';

it('opens the notes from the home page', async () => {
  logInAsDemo();
  const app = renderApp('/');

  await screen.findByRole('heading', { name: 'Your notes' });
  expect(app.router.state.location.pathname).toBe('/notes');
  expect(document.title).toBe('Your notes · Notes');
});

it('shows a not found page for an unknown address', async () => {
  renderApp('/nowhere');

  expect(await screen.findByRole('heading', { name: 'Page not found' })).toBeVisible();
});

it('moves focus to the main heading after navigating', async () => {
  logInAsDemo();
  renderApp('/notes');
  const user = userEvent.setup();

  await user.click(await screen.findByRole('link', { name: 'New note' }));

  const heading = await screen.findByRole('heading', { name: 'New note' });
  await waitFor(() => expect(heading).toHaveFocus());
});

it('shows the root error page when the session check fails', async () => {
  worker.use(
    http.get('/api/v1/users/me', () =>
      HttpResponse.json(
        { type: 'urn:problem:service-unavailable', title: 'Unavailable', status: 503 },
        { status: 503, headers: { 'X-Request-Id': 'req_root' } },
      ),
    ),
  );
  renderApp('/notes');

  expect(await screen.findByRole('heading', { name: 'This page didn’t load' })).toBeVisible();
  expect(screen.getByText(/quote request ID req_root/)).toBeVisible();
});
