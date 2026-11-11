import type { Page } from '@playwright/test';
import { expect, expectAccessible, signUpWithData, test } from './fixtures';
import { type AppPage, pageUrl, publicPages, signedInPages } from './pages';

test('applies the stored theme before the app runs', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('theme', 'dark'));
  await page.route(/\/assets\/.+\.js$/, (route) => route.abort());
  await page.goto('/login');

  await expect(page.locator('html')).toContainClass('dark');
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).colorScheme)).toBe(
    'dark',
  );
});

const themes = [
  { choice: 'Light', dark: false },
  { choice: 'Dark', dark: true },
];

async function chooseTheme(page: Page, choice: string, dark: boolean) {
  const theme = page.getByRole('group', { name: 'Theme' });
  await theme.getByRole('button', { name: choice }).click();
  await expect(theme.getByRole('button', { name: choice })).toHaveAttribute('aria-pressed', 'true');
  await expect
    .poll(() => page.evaluate(() => document.documentElement.classList.contains('dark')))
    .toBe(dark);
}

async function expectPagesAccessible(page: Page, pages: AppPage[], params: Record<string, string>) {
  for (const { path, heading } of pages) {
    await page.goto(pageUrl(path, params));
    await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
    await expectAccessible(page);
  }
}

test('renders every page accessibly in light and dark themes', async ({ page }) => {
  for (const { choice, dark } of themes) {
    await page.goto('/login');
    await chooseTheme(page, choice, dark);
    await expectPagesAccessible(page, publicPages, {});
  }

  const params = await signUpWithData(page);
  for (const { choice, dark } of themes) {
    await page.goto('/notes');
    await chooseTheme(page, choice, dark);
    await expectPagesAccessible(page, signedInPages, params);

    await page.goto(pageUrl('/notes/$noteId', params));
    await page.getByRole('button', { name: 'Delete note' }).click();
    await expect(page.getByRole('alertdialog')).toBeVisible();
    await expectAccessible(page);
  }
});

test('follows the system theme live until the user picks one', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/login');
  const theme = page.getByRole('group', { name: 'Theme' });
  const html = page.locator('html');

  await expect(theme.getByRole('button', { name: 'System' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(html).toContainClass('dark');
  await page.emulateMedia({ colorScheme: 'light' });
  await expect(html).not.toContainClass('dark');

  await theme.getByRole('button', { name: 'Dark' }).click();
  await page.reload();
  await expect(html).toContainClass('dark');
  await expect(theme.getByRole('button', { name: 'Dark' })).toHaveAttribute('aria-pressed', 'true');
  await expectAccessible(page);
});
