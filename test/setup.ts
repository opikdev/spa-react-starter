import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll } from 'vitest';
import '@/index.css';
import { worker } from '@/mocks/browser';
import { resetDb } from '@/mocks/db';

beforeAll(() => worker.start({ quiet: true, onUnhandledFrame: 'error' }));

afterEach(() => {
  cleanup();
  worker.resetHandlers();
  resetDb();
});

afterAll(() => worker.stop());
