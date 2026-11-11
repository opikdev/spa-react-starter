# SPA React starter

A single-page app (SPA): React renders in the browser and calls your API. It's a production-ready notes app with sign-up, login, and notes you can page through, edit, and delete, ready to point at any API that meets its contract.

[![CI](https://github.com/opikdev/spa-react-starter/actions/workflows/ci.yml/badge.svg)](https://github.com/opikdev/spa-react-starter/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## Features

- **Bring your own API:** the app relies only on the contract in [docs/api-contract.md](docs/api-contract.md), and reaches it through one setting, `API_UPSTREAM`. CI runs the same end-to-end tests against TypeScript, Go, and Python example APIs.
- **No token in JavaScript:** login uses an `HttpOnly`, `SameSite=Strict` session cookie on the app's own origin. Nothing sensitive goes in storage or URLs.
- **Typed client:** `openapi-typescript` generates types from the committed OpenAPI document, and the checks fail when they're stale.
- **Fast by default:** React 19 with the React Compiler, route-level code splitting, preloading on hover, data loaded in route loaders, and a 140 kB gzip budget for the initial JavaScript.
- **Hardened image:** non-root nginx that runs on a read-only filesystem, a strict Content Security Policy with Trusted Types, HSTS, precompressed assets, and immutable caching.
- **Accessible:** WCAG 2.2 AA in light and dark themes, with axe finding no violations on any page, keyboard-only flows, and focus moved to each page's heading.
- **Light, dark, or system theme:** the choice is saved, applied before first paint without an inline script, and follows system changes live.
- **Real error handling:** RFC 9457 problem details become plain messages, field errors land on their fields, 429s say when to retry, and server errors show a request ID to quote.
- **Runs without a backend:** `pnpm dev:mock` runs the whole app against an in-memory API in the browser, the same one the component tests use.
- **Agent-ready:** `AGENTS.md`, skills, and checks that run on every commit.
- **Strict gates:** lint, strict types, 90% coverage, an architecture test, bundle budgets, Lighthouse scores of 0.95 or more for performance and 1 for accessibility and best practices, and end-to-end tests against the real image.

## Quick start

You need Docker:

```sh
git clone https://github.com/opikdev/spa-react-starter
cd spa-react-starter
docker compose up --build --wait web
```

Open <http://localhost:8080> and log in as `demo@example.com` with the password `demo-password-123`. Compose runs the app's image and an example API with Postgres. The example API is only there to try the app, so replace it with your own, as [docs/use-your-own-api.md](docs/use-your-own-api.md) explains.

If port 8080 or 3000 is taken, set `WEB_PORT` or `API_PORT` before running Compose.

## Start your own project

Create a renamed copy with [pik](https://github.com/opikdev/pik). It downloads this starter's latest release, then sets your project name and GitHub owner:

```sh
pik new spa-react-starter my-app
```

Or select **Use this template** on GitHub. That copy keeps the name `spa-react-starter` and the owner `opikdev`, so follow `pik.yaml` by hand: swap the `replace` text, delete the `exclude` paths, and run the `setup` commands.

## Usage

To work on the code, you need Node 26 or later and pnpm:

```sh
pnpm install
cp .env.example .env
pnpm dev:mock
```

`pnpm dev:mock` needs no backend. To use a real API, start one, set `API_UPSTREAM` in `.env`, and run `pnpm dev`. The example API starts with `docker compose up --wait api`.

| Task | Command |
|---|---|
| Run against the API in `API_UPSTREAM` | `pnpm dev` |
| Run against the in-memory mock API | `pnpm dev:mock` |
| Regenerate the API types from `API_SCHEMA` | `pnpm gen:api` |
| Run lint, types, API type freshness, tests, coverage, bundle budgets, and repo checks | `pnpm verify` |
| Run the end-to-end tests against the image and an example API | `pnpm test:e2e` |
| Build the production files into `dist/` | `pnpm build` |
| Add a shadcn/ui component | `pnpm exec shadcn add <component>` |

`pnpm test:e2e` uses the TypeScript example API. Set `E2E_API` to `go` or `fastapi` to run it against the others.

## Documentation

- [API contract](docs/api-contract.md): every endpoint, header, and error the app relies on
- [Use your own API](docs/use-your-own-api.md): point the app at your backend and adapt it
- [Architecture](docs/architecture.md): how a page loads, and which module does what
- [Operations](docs/operations.md): image settings, security headers, caching, and proxies
- [Decisions](docs/decisions/): why it's built this way

## Project structure

| Path | Purpose |
|---|---|
| `src/routes/` | File-based routes: loaders, guards, and pages |
| `src/features/` | One folder per feature, such as `auth` and `notes`, with its API calls, hooks, and components |
| `src/lib/api/` | The generated schema, the API client, and problem details handling |
| `src/components/` | Shared components, with shadcn/ui components in `ui/` |
| `src/mocks/` | The in-memory API for `pnpm dev:mock` and tests |
| `test/`, `e2e/` | App-level and architecture tests, and Playwright end-to-end tests |
| `docker/` | nginx configuration and the example API's database setup |
| `openapi.yaml` | The API contract the types are generated from |

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request, and follow the [code of conduct](CODE_OF_CONDUCT.md).

## Security

Report vulnerabilities as described in [SECURITY.md](SECURITY.md). The app never handles the session token, as [decision 001](docs/decisions/001-same-origin-proxy-and-cookie-sessions.md) explains.

## License

Released under the [MIT License](LICENSE).
