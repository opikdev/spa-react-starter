import type { Page } from '@playwright/test';
import { expect, signUpWithData, test } from './fixtures';
import { type AppPage, pageUrl, publicPages, signedInPages } from './pages';

async function expectFocusOnArrival(page: Page, pages: AppPage[], params: Record<string, string>) {
  for (const { path, heading } of pages) {
    await page.goto('/nowhere');
    await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
    await page.evaluate((url) => history.pushState({}, '', url), pageUrl(path, params));

    await expect(page.getByRole('heading', { level: 1, name: heading })).toBeFocused();
    await expect(page).toHaveTitle(`${heading} · Notes`);
  }
}

test('moves focus to the heading and sets the title on every public page', async ({ page }) => {
  await expectFocusOnArrival(page, publicPages, {});
});

test('moves focus to the heading and sets the title on every signed-in page', async ({ page }) => {
  await expectFocusOnArrival(page, signedInPages, await signUpWithData(page));
});
