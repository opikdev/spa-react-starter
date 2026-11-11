import { QueryClient } from '@tanstack/react-query';
import { expect, it } from 'vitest';
import { createAppRouter } from '@/router';
import { publicPages, signedInPages } from '../e2e/pages';

function routedPages(signedIn: boolean): string[] {
  const { routesById } = createAppRouter(new QueryClient());
  return Object.values(routesById)
    .filter((route) => route.options.component && !route.isRoot)
    .filter((route) => route.id.startsWith('/_authenticated/') === signedIn)
    .map((route) => route.fullPath.replace(/(.)\/$/, '$1'))
    .sort();
}

it('lists every page route for the end-to-end tests', () => {
  expect(routedPages(false)).toEqual(publicPages.map((page) => page.path).sort());
  expect(routedPages(true)).toEqual(signedInPages.map((page) => page.path).sort());
});
