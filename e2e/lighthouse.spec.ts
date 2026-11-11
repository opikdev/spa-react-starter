import { chromium } from '@playwright/test';
import lighthouse from 'lighthouse';
import { expect, signUpWithData, test } from './fixtures';
import { pageUrl, publicPages, signedInPages } from './pages';

const budgets = { performance: 0.95, accessibility: 1, 'best-practices': 1 };
const debuggingPort = 9333;
const signedOutSessionCheckLogs401 = ['errors-in-console'];

test('meets the Lighthouse budgets on every page', async ({ baseURL }, testInfo) => {
  test.setTimeout(300_000);
  const context = await chromium.launchPersistentContext(testInfo.outputPath('profile'), {
    args: [`--remote-debugging-port=${debuggingPort}`],
  });
  const page = await context.newPage();

  const scores: Record<string, Record<string, number | null>> = {};
  async function audit(path: string, skipAudits: string[] = []) {
    const result = await lighthouse(`${baseURL}${path}`, {
      port: debuggingPort,
      logLevel: 'error',
      onlyCategories: Object.keys(budgets),
      disableStorageReset: true,
      skipAudits,
    });
    const categories = result?.lhr.categories ?? {};
    scores[path] = Object.fromEntries(
      Object.keys(budgets).map((name) => [name, categories[name]?.score ?? null]),
    );
  }

  for (const { path } of publicPages) await audit(path, signedOutSessionCheckLogs401);
  const params = await signUpWithData(page);
  for (const { path } of signedInPages) await audit(pageUrl(path, params));
  await context.close();
  console.log(JSON.stringify(scores, null, 2));

  for (const [path, pageScores] of Object.entries(scores)) {
    for (const [name, minimum] of Object.entries(budgets)) {
      expect(pageScores[name], `${name} on ${path}`).toBeGreaterThanOrEqual(minimum);
    }
  }
});
