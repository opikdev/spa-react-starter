import { expect, expectAccessible, signUpThroughApi, test } from './fixtures';

test('creates, pages, edits, resolves a conflict, and deletes notes', async ({ page }) => {
  await signUpThroughApi(page);
  for (let index = 1; index <= 20; index += 1) {
    const created = await page.request.post('/api/v1/notes', { data: { title: `Seed ${index}` } });
    expect(created.status()).toBe(201);
  }

  await page.goto('/notes/new');
  await expect(page.getByRole('heading', { name: 'New note' })).toBeVisible();
  await expectAccessible(page);
  await page.getByLabel('Title').fill('Groceries');
  await page.getByLabel('Note').fill('Milk and bread');
  await page.getByRole('button', { name: 'Save note' }).click();
  await expect(page.getByRole('heading', { name: 'Edit note' })).toBeVisible();
  await expect(page.getByLabel('Title')).toHaveValue('Groceries');
  await expectAccessible(page);
  const noteUrl = new URL(page.url()).pathname;

  await page.getByRole('link', { name: 'Notes', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Your notes' })).toBeVisible();
  await expect(page.getByText('Showing 20 notes')).toBeVisible();
  await expectAccessible(page);
  await page.getByRole('button', { name: 'Load more notes' }).click();
  await expect(page.getByText('Showing 21 notes')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Load more notes' })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Seed 1', exact: true })).toBeVisible();

  await page.getByRole('link', { name: 'Groceries' }).click();
  await page.getByLabel('Title').fill('Groceries for Monday');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByText('Changes saved.')).toBeVisible();

  const current = await page.request.get(`/api${noteUrl.replace('/notes/', '/v1/notes/')}`);
  const patched = await page.request.patch(`/api${noteUrl.replace('/notes/', '/v1/notes/')}`, {
    headers: { 'If-Match': current.headers().etag ?? '' },
    data: { title: 'Changed in another tab' },
  });
  expect(patched.status()).toBe(200);

  await page.getByLabel('Title').fill('My stale edit');
  await page.getByRole('button', { name: 'Save changes' }).click();
  const conflict = page.getByRole('dialog', { name: 'This note changed while you were editing' });
  await expect(conflict).toBeVisible();
  await expectAccessible(page);
  await conflict.getByRole('button', { name: 'Load latest version' }).click();
  await expect(conflict).toBeHidden();
  await expect(page.getByLabel('Title')).toHaveValue('Changed in another tab');

  await page.getByRole('button', { name: 'Delete note' }).click();
  const confirm = page.getByRole('dialog', { name: 'Delete this note?' });
  await expect(confirm.getByRole('button', { name: 'Keep note' })).toBeFocused();
  await expectAccessible(page);
  await page.keyboard.press('Escape');
  await expect(confirm).toBeHidden();
  await page.getByRole('button', { name: 'Delete note' }).click();
  await confirm.getByRole('button', { name: 'Delete note' }).click();

  await expect(page.getByRole('heading', { name: 'Your notes' })).toBeVisible();
  await expect(page.getByText('Showing 20 notes')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Changed in another tab' })).toHaveCount(0);

  await page.goto(noteUrl);
  await expect(page.getByRole('heading', { name: 'Note not found' })).toBeVisible();
  await expectAccessible(page);
});
