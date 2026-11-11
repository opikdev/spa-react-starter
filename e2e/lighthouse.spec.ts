import { chromium } from '@playwright/test';
import lighthouse from 'lighthouse';
import { expect, signUpThroughApi, test } from './fixtures';

const budgets = { performance: 0.95, accessibility: 1, 'best-practices': 1 };
const debuggingPort = 9333;

test('meets the Lighthouse budgets on every signed-in page', async ({ baseURL }, testInfo) => {
  test.setTimeout(180_000);
  const context = await chromium.launchPersistentContext(testInfo.outputPath('profile'), {
    args: [`--remote-debugging-port=${debuggingPort}`],
  });
  const page = await context.newPage();
  await signUpThroughApi(page);
  const note = await page.request.post('/api/v1/notes', { data: { title: 'Lighthouse' } });
  const { id } = await note.json();

  const scores: Record<string, Record<string, number | null>> = {};
  for (const path of ['/notes', '/notes/new', `/notes/${id}`]) {
    const result = await lighthouse(`${baseURL}${path}`, {
      port: debuggingPort,
      logLevel: 'error',
      onlyCategories: Object.keys(budgets),
      disableStorageReset: true,
    });
    const categories = result?.lhr.categories ?? {};
    scores[path] = Object.fromEntries(
      Object.keys(budgets).map((name) => [name, categories[name]?.score ?? null]),
    );
  }
  await context.close();
  console.log(JSON.stringify(scores, null, 2));

  for (const [path, pageScores] of Object.entries(scores)) {
    for (const [name, minimum] of Object.entries(budgets)) {
      expect(pageScores[name], `${name} on ${path}`).toBeGreaterThanOrEqual(minimum);
    }
  }
});
