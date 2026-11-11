import { expect, it, vi } from 'vitest';
import { ApiError } from './api/problem';
import { setServerFieldErrors } from './form';

const validationError = (fields: string[]) =>
  new ApiError(new Response(null, { status: 400 }), {
    type: 'urn:problem:validation-failed',
    errors: fields.map((field) => ({ field, detail: `${field} is wrong` })),
  });

it('puts every field error on its field and focuses the first', () => {
  const setError = vi.fn();

  expect(
    setServerFieldErrors(validationError(['title', 'body']), ['title', 'body'], setError),
  ).toBe(true);
  expect(setError.mock.calls).toEqual([
    ['title', { message: 'title is wrong' }, { shouldFocus: true }],
    ['body', { message: 'body is wrong' }, { shouldFocus: false }],
  ]);
});

it('reports when a field error has no matching field', () => {
  const setError = vi.fn();

  expect(setServerFieldErrors(validationError(['title', 'tags']), ['title'], setError)).toBe(false);
  expect(setError).toHaveBeenCalledTimes(1);
});

it('ignores errors without field errors', () => {
  const setError = vi.fn();

  expect(setServerFieldErrors(new TypeError('offline'), ['title'], setError)).toBe(false);
  expect(setError).not.toHaveBeenCalled();
});
