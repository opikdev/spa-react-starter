import babel from '@rolldown/plugin-babel';
import tailwindcss from '@tailwindcss/vite';
import { tanstackRouter } from '@tanstack/router-plugin/vite';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import { playwright } from '@vitest/browser-playwright';
import { msw } from 'msw/vite';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const isTest = mode === 'test';
  const usesMocks = mode === 'mock' || isTest;
  const compile = process.env.COVERAGE !== 'true';

  return {
    plugins: [
      tanstackRouter({ target: 'react', autoCodeSplitting: !isTest, quoteStyle: 'single' }),
      react(),
      compile && babel({ presets: [reactCompilerPreset()] }),
      tailwindcss(),
      usesMocks && msw({ mode: 'worker-only' }),
    ],
    resolve: { tsconfigPaths: true },
    server: {
      proxy: {
        '/api/': {
          target: env.API_UPSTREAM ?? 'http://localhost:3000',
          rewrite: (path) => path.replace(/^\/api/, ''),
          xfwd: true,
        },
      },
    },
    test: {
      include: ['src/**/*.test.{ts,tsx}', 'test/**/*.test.{ts,tsx}'],
      setupFiles: ['test/setup.ts'],
      browser: {
        enabled: true,
        headless: true,
        provider: playwright(),
        instances: [{ browser: 'chromium' }],
      },
      coverage: {
        provider: 'v8',
        include: ['src/**/*.{ts,tsx}'],
        exclude: ['src/main.tsx', 'src/routeTree.gen.ts', 'src/mocks/**'],
        thresholds: { lines: 90, branches: 90, functions: 90, statements: 90 },
      },
    },
  };
});
