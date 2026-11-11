import { renderHook } from '@testing-library/react';
import { expect, it } from 'vitest';
import { useIdempotencyKey } from './idempotency';

it('reuses the key while the body stays the same', () => {
  const { result } = renderHook(() => useIdempotencyKey());
  const first = result.current.keyFor({ title: 'A' });

  expect(result.current.keyFor({ title: 'A' })).toBe(first);
  expect(result.current.keyFor({ title: 'B' })).not.toBe(first);
});

it('starts a new key after a reset', () => {
  const { result } = renderHook(() => useIdempotencyKey());
  const first = result.current.keyFor({ title: 'A' });
  result.current.reset();

  expect(result.current.keyFor({ title: 'A' })).not.toBe(first);
});
