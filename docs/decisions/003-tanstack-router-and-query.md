# 003. TanStack Router and TanStack Query

- **Status**: accepted
- **Context**: An SPA needs typed routes and search params, code splitting, guards, and data that starts loading before a page renders, without waterfalls or duplicate fetches.
- **Decision**: Use TanStack Router with file-based routes, `autoCodeSplitting`, zod-validated search params, and `defaultPreload: 'intent'`. Load data in route loaders with Query's `ensureQueryData`, and read it in components with `useSuspenseQuery`. Use react-hook-form with zod for forms, and `zod/mini` everywhere, because full zod isn't tree-shakable and added about 18 kB gzip to the first load.
- **Consequences**:
  - Routes, params, and links are type-checked, and each page's code and data load in parallel, even on hover.
  - Query owns caching. The router's `defaultPreloadStaleTime` is 0 so it doesn't cache a second copy.
  - The package declares `sideEffects`, so feature `index.ts` files don't pull every component into the first chunk.
  - Two TanStack libraries to learn instead of one framework.
