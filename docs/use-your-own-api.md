# Use your own API

The app talks to one API through the same-origin `/api/` path. Any API that meets [the contract](api-contract.md) works without code changes. An API with different endpoints works after you regenerate the client and adapt the features that call it.

## Check what your API must provide

- The endpoints, fields, and status codes in [docs/api-contract.md](api-contract.md), under `/v1`.
- Cookie sessions: `POST /v1/sessions` with `delivery: "cookie"` sets an `HttpOnly` session cookie, and every other endpoint accepts it.
- RFC 9457 problem details for errors, with a stable `type`, and an `X-Request-Id` header on every response.
- Trust for one proxy hop, so rate limits and logs see the user's IP from `X-Forwarded-For` instead of the proxy's. The example APIs read `TRUST_PROXY_HOPS=1`. Add one hop for each load balancer in front of the app.

## Point the app at your API

1. In development, set `API_UPSTREAM` in `.env` to your API's base URL, such as `http://localhost:4000`, with no path. Then run `pnpm dev`. Vite proxies `/api/` to it.
2. In production, set `API_UPSTREAM` on the container. One image serves every environment:

   ```sh
   docker run --read-only --tmpfs /tmp -p 8080:8080 -e API_UPSTREAM=http://api.internal:4000 ghcr.io/opikdev/spa-react-starter:<VERSION>
   ```

3. With Compose, skip the example API with `--no-deps`:

   ```sh
   API_UPSTREAM=http://host.docker.internal:4000 docker compose up --build --no-deps web
   ```

Serve the app over HTTPS anywhere but `localhost`, because the session cookie is `Secure`.

## Regenerate the client

1. Point `API_SCHEMA` at your OpenAPI document, as a file path or URL, in `.env` or the shell:

   ```sh
   API_SCHEMA=http://localhost:4000/openapi.json pnpm gen:api
   ```

   This copies the document into `openapi.yaml`, then writes `src/lib/api/schema.d.ts`.

2. Run `pnpm typecheck`. Every call that no longer matches your API fails here.
3. Commit both files. `pnpm verify` fails when `schema.d.ts` doesn't match `openapi.yaml`.

## Adapt or delete the sample features

| To change | Edit |
|---|---|
| Login, logout, sign-up, and the session check | `src/features/auth/api.ts`. Keep `sessionQueryOptions` returning the user or `null`, because the route guards rely on it |
| Error messages for your problem types | `messages` in `src/lib/api/problem.ts` |
| The notes feature | Delete `src/features/notes/`, `src/routes/_authenticated/notes/`, and the notes handlers in `src/mocks/handlers.ts`, then add your own feature the same way |
| The mock API | `src/mocks/`, so `pnpm dev:mock` and the tests match your API |
| The example API in Compose | Delete the `api-*` services from `compose.yaml`, `compose.go.yaml`, `compose.fastapi.yaml`, and `docker/postgres/`, and point `API_UPSTREAM` at yours |
| The end-to-end tests | `e2e/`, and `e2e/global-setup.ts`, which starts the example API |

Add a feature as `src/features/<name>/` with `api.ts` for its calls, hooks, components, tests, and an `index.ts` that exports what routes need. `test/architecture.test.ts` fails if another folder reaches past `index.ts`, or if anything but an `api.ts` calls the client.
