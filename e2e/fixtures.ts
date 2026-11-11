import AxeBuilder from '@axe-core/playwright';
import { test as base, expect, type Page } from '@playwright/test';

declare global {
  interface Window {
    securityViolations: string[];
  }
}

export const test = base.extend<{ problems: string[] }>({
  problems: [
    async ({ page }, use) => {
      const problems: string[] = [];
      await page.addInitScript(() => {
        window.securityViolations = [];
        document.addEventListener('securitypolicyviolation', (event) => {
          window.securityViolations.push(`${event.violatedDirective}: ${event.blockedURI}`);
        });
      });
      page.on('pageerror', (error) => problems.push(`Uncaught: ${error.message}`));
      page.on('console', (message) => {
        if (/Content Security Policy|Trusted Type/i.test(message.text())) {
          problems.push(`Console: ${message.text()}`);
        }
      });
      await use(problems);
      const violations =
        (await page.evaluate(() => window.securityViolations).catch(() => [])) ?? [];
      expect([...problems, ...violations]).toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };

export async function expectAccessible(page: Page) {
  await page.evaluate(() =>
    Promise.allSettled(document.getAnimations().map((animation) => animation.finished)),
  );
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(results.violations.map((violation) => `${violation.id}: ${violation.help}`)).toEqual([]);
}

export function uniqueEmail(): string {
  return `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

export const password = 'correct-horse-battery';

export async function signUpThroughApi(page: Page): Promise<string> {
  const email = uniqueEmail();
  expect((await page.request.post('/api/v1/users', { data: { email, password } })).status()).toBe(
    201,
  );
  const login = await page.request.post('/api/v1/sessions', {
    data: { email, password, delivery: 'cookie' },
  });
  expect(login.status()).toBe(201);
  return email;
}
