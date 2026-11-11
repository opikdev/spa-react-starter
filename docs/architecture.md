# Architecture

The app is static files plus a proxy. The browser loads the built React app from nginx and calls the API on the same origin under `/api/`. nginx, or Vite in development, forwards those calls to `API_UPSTREAM`. The browser holds the session cookie, so the app's code never sees a token.

```mermaid
flowchart LR
  browser[Browser: React app] -- "/, /assets/*" --> nginx
  browser -- "/api/v1/*, with cookie" --> nginx
  nginx -- "/v1/*" --> api[Your API: API_UPSTREAM]
```

## How a page loads

1. **Theme.** `public/theme.js` runs before first paint and sets the `dark` class on `<html>` from the saved choice or the system setting. [Decision 008](decisions/008-theme-toggle-without-inline-script.md) explains why it isn't inline.
2. **Root.** `src/routes/__root.tsx` runs `GET /v1/users/me` once through `sessionQueryOptions`, which caches the user or `null`.
3. **Guard.** Routes under `src/routes/_authenticated/` redirect to `/login?redirect=<path>` when the user is `null`. The login page accepts only internal paths in `redirect`.
4. **Loader.** The route's loader calls `ensureQueryData`, so data starts loading in parallel with the route's code chunk. Hovering a link preloads both.
5. **Render.** Components read the same query with `useSuspenseQuery`. TanStack Query keeps results fresh for 30 seconds, and the session for 5 minutes.
6. **Focus.** After each navigation, focus moves to the page's `h1`, and the page sets `document.title`.

A 401 from any call, other than a wrong password, marks the user logged out and sends them to log in, then back to where they were. `createQueryClient` in `src/lib/query-client.ts` does this for every query and mutation.

## Modules

| Path | Does |
|---|---|
| `src/main.tsx` | Starts the mock API in mock mode, then renders the app |
| `src/app.tsx` | Creates the query client and router, and wires session loss to the login redirect |
| `src/router.tsx` | Router settings: preloading, default pending, error, and not found views |
| `src/routes/` | File routes. `pnpm gen:routes` generates `routeTree.gen.ts` from them, with the settings in `tsr.config.json` |
| `src/features/auth/` | Session query, login, logout, sign-up, and the redirect check |
| `src/features/notes/` | Notes queries and mutations, the list, and the create and edit forms |
| `src/lib/api/` | Generated `schema.d.ts`, the `openapi-fetch` client, `request()`, and `ApiError` with user messages |
| `src/lib/` | Query client, idempotency keys, form error mapping, error reporting, and the theme |
| `src/components/` | Page heading, form fields, route states, theme toggle, and shadcn/ui components in `ui/` |
| `public/theme.js` | Applies the saved theme before first paint |
| `src/mocks/` | MSW handlers that implement the contract in memory |
| `docker/nginx/` | Server config, security headers, and the startup check for `API_UPSTREAM` |

## Dependencies

Imports point one way. `test/architecture.test.ts` fails on any other import.

```mermaid
flowchart LR
  routes --> features
  routes --> components
  features --> components
  features --> lib
  components --> lib
```

- A feature imports another feature only through its `index.ts`.
- Only a feature's `api.ts` imports the API client. Components call hooks, never the API.
- `components/` and `lib/` never import features or routes.
- Only `src/main.tsx` imports `src/mocks/`, behind the mock mode check, so the build drops it.
- Every component that uses react-hook-form starts with `'use no memo'`, because the React Compiler would memoize its `register()` calls. [Decision 006](decisions/006-keep-forms-out-of-the-react-compiler.md) explains why.

## UI components

`src/components/ui/` holds shadcn/ui components in the `base-nova` style, on Base UI. `components.json` configures the CLI, and `src/index.css` holds the tokens. [Decision 007](decisions/007-shadcn-ui-on-base-ui.md) explains the choice.

To add a component:

1. Run `pnpm exec shadcn add <component>`, then `pnpm exec biome check --write src/components/ui` to match the project's style.
2. Give each interactive element `pointer-coarse:min-h-11 pointer-coarse:min-w-11`, or `pointer-coarse:h-11` for a fixed-height field, so touch targets are 44px.
3. Run `pnpm test:e2e`. It fails on any CSP violation or axe finding.

`src/index.css` already applies the focus outline and reduced motion to every component.

## Bundle budget

`pnpm check:bundle` fails when the initial JavaScript, the entry chunk plus its preloads, is over 144 kB gzipped, or the CSS is over 8 kB. The initial JavaScript is about 131 kB: React DOM, TanStack Router and Query, the API client, and the header's buttons. Route components load with their route.

- Route `beforeLoad`, `loader`, and `validateSearch` stay in the entry chunk, so keep them small.
- `ApiError` and the login route's `validateSearch` check their input with type guards, not zod, so zod loads only with the forms.

## Tests

| Layer | Runs | Against |
|---|---|---|
| Unit and component | `pnpm test`, in Chromium through Vitest browser mode | The in-memory API in `src/mocks/` |
| Architecture | `pnpm test` | Imports, the `'use no memo'` directive, and code comments |
| End to end | `pnpm test:e2e`, with Playwright | The built image and a real example API in Docker |
| Page list | `pnpm test` | `test/pages.test.ts` fails when a route with a component is missing from `e2e/pages.ts` |
| Axe in both themes, focus, and Lighthouse | `pnpm test:e2e` | Every page in `e2e/pages.ts`, in the built image. Signed-out pages skip Lighthouse's `errors-in-console`, because the session check logs a 401 |
