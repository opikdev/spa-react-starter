import { expect, it } from 'vitest';
import { isInternalPath } from './redirect';

it.each(['/notes', '/notes/note_1?tab=history#top'])('accepts the internal path %s', (path) => {
  expect(isInternalPath(path)).toBe(true);
});

it.each([
  'https://evil.example/notes',
  '//evil.example/notes',
  '/\\evil.example/notes',
  'javascript:alert(1)',
  'notes',
  '',
])('rejects %s', (path) => {
  expect(isInternalPath(path)).toBe(false);
});
