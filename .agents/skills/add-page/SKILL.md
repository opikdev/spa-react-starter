---
name: add-page
description: Add a page, screen, or route to this app, with its loader, tests, and docs. Use whenever a request adds or moves a file in src/routes/ or a link in the header.
---

# Add a page

1. **Route file.** Put a signed-in page in `src/routes/_authenticated/`, and a public page in `src/routes/`. Then run `pnpm gen:routes`.
2. **Data.** Export `queryOptions` from the feature's `api.ts`. In the route, load it with `loader: ({ context }) => context.queryClient.ensureQueryData(...)`, and read it in the component with `useSuspenseQuery`. `src/routes/_authenticated/notes/$noteId.tsx` is the example.
3. **Loading and errors.** The router's `PendingView`, `RouteError`, and `NotFound` cover them. Add a `notFoundComponent` when a missing item is expected, as `$noteId.tsx` does.
4. **Heading.** Render one `<PageHeading>` from `@/components/page-heading`. It sets the title and receives focus.
5. **Header link.** Add a `<Link>` with the shared `navLink` class to the signed-in or signed-out branch of the header in `src/routes/__root.tsx`. Don't restyle the other links.
6. **Unit test.** Test the page in its feature's `*.test.tsx` with `renderApp()` from `test/render.tsx` and the MSW mocks in `src/mocks/`. Cover the data, an API error, and, for a signed-in page, the redirect to login and back.
7. **End-to-end test.** Add the page to `publicPages` or `signedInPages` in `e2e/pages.ts`. That adds it to the axe check in both themes, the focus and title check, and Lighthouse, and `test/pages.test.ts` fails until you do. For a path parameter, return its value from `signUpWithData()` in `e2e/fixtures.ts`. Test the page's own flow in an `e2e/` spec that calls `expectAccessible(page)`.
8. **Docs.** Update the modules table in `docs/architecture.md` if you added a module, and `docs/api-contract.md` if you call a new endpoint. Add a line under `## [Unreleased]` in `CHANGELOG.md`.
9. **Verify.** Run `pnpm verify`, then `pnpm test:e2e`. Both must pass.
