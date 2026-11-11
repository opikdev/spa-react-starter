# 002. Contract first, backend agnostic

- **Status**: accepted
- **Context**: A starter tied to one backend is useless to teams with their own API, and hand-written client types drift from the server.
- **Decision**: Document the API the app needs in `docs/api-contract.md`, commit the OpenAPI document as `openapi.yaml`, and generate types with `openapi-typescript` for an `openapi-fetch` client. `pnpm gen:api` reads `API_SCHEMA`, a file or URL, and `pnpm check:api` fails when the types are stale. Example APIs from other starters run only in Compose and the end-to-end tests, as released images, and CI runs the same tests against all three.
- **Consequences**:
  - Any API that meets the contract works without code changes, and a mismatch shows up as type errors.
  - The app builds and its unit tests pass with no backend, using the MSW mock of the contract.
  - `openapi-typescript` needs the TypeScript 5 compiler API, so `.pnpmfile.cjs` gives it its own TypeScript 5 while the project uses TypeScript 7.
  - Changing the contract means changing `openapi.yaml`, the mock in `src/mocks/`, and the docs together.
