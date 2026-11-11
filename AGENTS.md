# Agent guide

A single-page app (SPA) in React 19: TanStack Router and Query, a typed OpenAPI client, cookie sessions through a same-origin proxy, Tailwind with shadcn/ui components on Base UI, and a hardened nginx image. Auth and notes are the sample features to copy or replace.

| Path | Purpose |
|---|---|
| [docs/architecture.md](docs/architecture.md) | How a page loads, and which module does what |
| [docs/api-contract.md](docs/api-contract.md) | Every endpoint, header, and error the app relies on |
| [docs/use-your-own-api.md](docs/use-your-own-api.md) | How to point the app at another API and adapt the features |
| [docs/operations.md](docs/operations.md) | Image settings, security headers, caching, and proxies |
| [docs/decisions/](docs/decisions/) | Why it's built this way |
| `.agents/skills/` | Step-by-step guides for recurring tasks |
| `.mcp.json` | MCP servers for this project |

## Commands

| Task | Command |
|---|---|
| Run with no backend | `pnpm dev:mock` |
| Run against the API in `API_UPSTREAM` | `pnpm dev` |
| Run the image and the example API | `docker compose up --build --wait web` |
| Run all gates | `pnpm verify` |
| Test the image against an example API | `pnpm test:e2e`, with `E2E_API` set to `hono`, `go`, or `fastapi` |
| Regenerate API types | `pnpm gen:api` |
| Regenerate the route tree after adding, moving, or deleting a route file | `pnpm gen:routes` |

## Rules

- Don't commit until `pnpm verify` passes. Its tests need Playwright's Chromium: `pnpm exec playwright install chromium`.
- Run `pnpm verify` before calling work done. For changes to Docker, nginx, Compose, headers, or a user flow, run `pnpm test:e2e` too. It needs Docker.
- If the check blocks you, fix the cause. Never edit `.agents/check.sh`, `.githooks/`, or the harness workflow to get past it, and never use `--no-verify`. If the request can't be done without that, stop and ask.
- After cloning, run `git config core.hooksPath .githooks` once to turn on the hook.
- The app relies only on [the API contract](docs/api-contract.md). Never import from another starter. Change the contract in `openapi.yaml`, `src/mocks/`, and the docs together, then run `pnpm gen:api`. Never edit `src/lib/api/schema.d.ts` or `src/routeTree.gen.ts` by hand. `pnpm verify` fails when either is stale.
- Never handle the session token, and never store anything sensitive in `localStorage`, `sessionStorage`, or URLs.
- Call the API only from a feature's `api.ts`, through `request()` in `src/lib/api/request.ts`. Import another feature only through its `index.ts`. `test/architecture.test.ts` enforces both.
- Load page data in the route's `loader` with `ensureQueryData`, and read it with `useSuspenseQuery`.
- Start every component that uses react-hook-form with `'use no memo'`, and read form state in children with `useFormState`. The architecture test enforces the directive.
- Show errors with `errorMessage()` from `src/lib/api/problem.ts`, and put field errors on fields with `setServerFieldErrors()`.
- Keep the CSP strict: no inline scripts or styles, no `innerHTML`, no libraries that inject `<style>` tags. Add UI components with `pnpm exec shadcn add`, as [docs/architecture.md](docs/architecture.md#ui-components) explains.
- Every page has one `PageHeading`, which sets the title and receives focus. Use tokens from `src/index.css`, never raw colors.
- Only `VITE_` variables reach the browser, so never put secrets in them.
- Don't edit files listed in `.baseline.sha256`. They come from [opikdev/starters](https://github.com/opikdev/starters).
- Keep this file a short map, and put detail in `docs/`.
- Fix any doc your change makes wrong, in the same change.
- Record significant decisions with the `record-decision` skill.
- Back important rules with a lint rule, hook, or CI check.
