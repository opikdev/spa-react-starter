import { createMemoryHistory } from '@tanstack/react-router';
import { render } from '@testing-library/react';
import { App, createApp } from '@/app';
import { db, demoUser } from '@/mocks/db';

export function renderApp(path: string) {
  const app = createApp(createMemoryHistory({ initialEntries: [path] }));
  render(<App app={app} />);
  return app;
}

export function logInAsDemo(): void {
  db.currentUserId = db.users.get(demoUser.email)?.id ?? null;
}
