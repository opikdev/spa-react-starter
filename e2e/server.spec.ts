import { expect, test } from './fixtures';

test('sends security and cache headers', async ({ request }) => {
  const page = await request.get('/notes');
  expect(page.status()).toBe(200);
  expect(page.headers()).toMatchObject({
    'content-security-policy': expect.stringContaining("script-src 'self'"),
    'strict-transport-security': expect.stringContaining('max-age='),
    'x-content-type-options': 'nosniff',
    'referrer-policy': 'strict-origin-when-cross-origin',
    'cross-origin-opener-policy': 'same-origin',
    'cross-origin-resource-policy': 'same-origin',
    'cache-control': 'no-cache',
  });
  expect(page.headers()['content-security-policy']).toContain("require-trusted-types-for 'script'");

  const script = (await page.text()).match(/\/assets\/[^"]+\.js/)?.[0] ?? '';
  const asset = await request.get(script, { headers: { 'Accept-Encoding': 'gzip' } });
  expect(asset.headers()['cache-control']).toBe('public, max-age=31536000, immutable');
  expect(asset.headers()['content-encoding']).toBe('gzip');

  const api = await request.get('/api/v1/users/me');
  expect(api.status()).toBe(401);
  expect(api.headers()['content-type']).toContain('application/problem+json');
  expect(api.headers()['x-request-id']).toBeTruthy();
  expect(api.headers()['content-security-policy']).toContain("default-src 'self'");
});

test('returns real 404s for missing files and never serves the mock worker', async ({
  request,
}) => {
  expect((await request.get('/assets/missing.js')).status()).toBe(404);
  expect((await request.get('/mockServiceWorker.js')).status()).toBe(404);
  expect((await request.get('/healthz')).status()).toBe(200);
});
