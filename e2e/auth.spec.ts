import { expect, expectAccessible, password, test, uniqueEmail } from './fixtures';

test('registers, keeps the session in an httpOnly cookie, and logs out', async ({ page }) => {
  await page.goto('/notes');
  await expect(page.getByRole('heading', { name: 'Log in' })).toBeVisible();
  await expect(page).toHaveURL('/login?redirect=%2Fnotes');
  await expectAccessible(page);

  await page.getByRole('link', { name: 'Create an account' }).click();
  await expect(page.getByRole('heading', { name: 'Create your account' })).toBeVisible();
  await expectAccessible(page);
  const email = uniqueEmail();
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Create account' }).click();

  await expect(page.getByRole('heading', { name: 'Your notes' })).toBeVisible();
  await expect(page.getByText('You have no notes yet.')).toBeVisible();
  await expectAccessible(page);

  const session = (await page.context().cookies()).find(
    (cookie) => cookie.name === '__Host-session',
  );
  expect(session).toMatchObject({ httpOnly: true, secure: true, sameSite: 'Strict', path: '/' });
  expect(await page.evaluate(() => document.cookie)).not.toContain('session');
  expect(await page.evaluate(() => JSON.stringify({ ...localStorage, ...sessionStorage }))).toBe(
    '{}',
  );

  await page.getByRole('button', { name: 'Log out' }).click();
  await expect(page.getByRole('heading', { name: 'Log in' })).toBeVisible();
  expect((await page.context().cookies()).map((cookie) => cookie.name)).not.toContain(
    '__Host-session',
  );

  await page.goto('/notes/new');
  await expect(page).toHaveURL('/login?redirect=%2Fnotes%2Fnew');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Log in' }).click();
  await expect(page.getByRole('heading', { name: 'New note' })).toBeVisible();
  await expect(page).toHaveURL('/notes/new');
});

test('logs in with the keyboard alone', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: 'Log in' })).toBeVisible();

  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to main content' })).toBeFocused();
  await page.keyboard.press('Enter');
  await page.keyboard.press('Tab');
  await expect(page.getByLabel('Email')).toBeFocused();
  await page.keyboard.type('demo@example.com');
  await page.keyboard.press('Tab');
  await page.keyboard.type('demo-password-123');
  await page.keyboard.press('Enter');

  await expect(page.getByRole('heading', { name: 'Your notes' })).toBeVisible();
});

test('shows wrong credentials and not found pages accessibly', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('demo@example.com');
  await page.getByLabel('Password').fill('wrong-password-123');
  await page.getByRole('button', { name: 'Log in' }).click();
  await expect(page.getByRole('alert')).toHaveText(
    'That email and password don’t match. Check both, then try again.',
  );
  await expectAccessible(page);

  await page.goto('/nowhere');
  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
  await expectAccessible(page);
});
