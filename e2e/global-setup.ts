import { execFileSync } from 'node:child_process';

const overrides: Record<string, string[]> = {
  hono: [],
  go: ['-f', 'compose.go.yaml'],
  fastapi: ['-f', 'compose.fastapi.yaml'],
};

export default function globalSetup() {
  const api = process.env.E2E_API ?? 'hono';
  const files = overrides[api];
  if (!files) throw new Error(`Unknown E2E_API "${api}". Use hono, go, or fastapi.`);

  const compose = ['compose', '-p', `spa-e2e-${api}`, '-f', 'compose.yaml', ...files];
  const env = {
    ...process.env,
    WEB_PORT: process.env.WEB_PORT ?? '8080',
    API_PORT: process.env.API_PORT ?? '3000',
    AUTH_RATE_LIMIT_PER_MINUTE: '1000',
    RATE_LIMIT_PER_MINUTE: '10000',
  };
  const run = (...args: string[]) =>
    execFileSync('docker', [...compose, ...args], { env, stdio: 'inherit' });

  run('up', '--build', '--wait', 'web');
  return () => run('down', '--volumes');
}
