# 004. Test in a real browser

- **Status**: accepted
- **Context**: jsdom and happy-dom lack native `<dialog>`, layout, focus rules, and service workers, so component tests there need polyfills and can pass while the real browser fails. The React Compiler changes when components re-render, so tests that skip it miss real bugs.
- **Decision**: Run unit and component tests in headless Chromium with Vitest browser mode and Testing Library, and mock the API with an MSW service worker using the same handlers as `pnpm dev:mock`. `pnpm test` runs the code with the React Compiler, as shipped. `pnpm test:coverage` runs without it, because v8 counts the compiler's memo cache checks as branches. Playwright runs end-to-end tests against the built image and real APIs.
- **Consequences**:
  - Focus, dialogs, and network behavior in tests match production, and the MSW mock is exercised by every test.
  - Tests need Playwright's Chromium, so CI and the dev container install it.
  - `pnpm verify` runs the component tests twice, once for behavior and once for coverage, which takes a few seconds more.
