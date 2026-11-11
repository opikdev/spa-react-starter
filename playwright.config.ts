import { defineConfig, devices } from '@playwright/test';

const port = process.env.WEB_PORT ?? '8080';

export default defineConfig({
  testDir: 'e2e',
  globalSetup: './e2e/global-setup.ts',
  forbidOnly: Boolean(process.env.CI),
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  timeout: 60_000,
  use: {
    baseURL: `http://localhost:${port}`,
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] }, testIgnore: /lighthouse\.spec\.ts/ },
    {
      name: 'lighthouse',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /lighthouse\.spec\.ts/,
      dependencies: ['chromium'],
    },
  ],
});
