import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App, createApp } from './app';
import { reportError } from './lib/reporting';
import './index.css';

if (import.meta.env.MODE === 'mock') {
  const { worker } = await import('./mocks/browser');
  await worker.start({ onUnhandledFrame: 'bypass', quiet: true });
}

const root = document.getElementById('root');
if (!root) throw new Error('index.html has no element with id "root"');

createRoot(root, { onUncaughtError: (error) => reportError(error) }).render(
  <StrictMode>
    <App app={createApp()} />
  </StrictMode>,
);
