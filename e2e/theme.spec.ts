import { expect, expectAccessible, signUpThroughApi, test } from './fixtures';

test('applies the stored theme before the app runs', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('theme', 'dark'));
  await page.route(/\/assets\/.+\.js$/, (route) => route.abort());
  await page.goto('/login');

  await expect(page.locator('html')).toContainClass('dark');
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).colorScheme)).toBe(
    'dark',
  );
});

test('renders every page accessibly in light and dark themes', async ({ page }) => {
  await signUpThroughApi(page);
  const note = await page.request.post('/api/v1/notes', { data: { title: 'Themes' } });
  const { id } = await note.json();
  const theme = page.getByRole('group', { name: 'Theme' });

  for (const { choice, dark } of [
    { choice: 'Light', dark: false },
    { choice: 'Dark', dark: true },
  ]) {
    await page.goto('/notes');
    await theme.getByRole('button', { name: choice }).click();
    await expect(theme.getByRole('button', { name: choice })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect
      .poll(() => page.evaluate(() => document.documentElement.classList.contains('dark')))
      .toBe(dark);
    await expectAccessible(page);

    for (const path of ['/notes/new', `/notes/${id}`]) {
      await page.goto(path);
      await expect(page.locator('main h1')).toBeVisible();
      await expectAccessible(page);
    }
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
