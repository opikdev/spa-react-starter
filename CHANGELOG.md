# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- Notes app in React 19 with the React Compiler, TanStack Router, and TanStack Query: sign-up, login, logout, and notes with cursor pagination, idempotent creates, and edits that resolve version conflicts.
- Typed API client generated from `openapi.yaml`, with problem details mapped to messages and form fields.
- Cookie sessions through a same-origin `/api/` proxy, set by `API_UPSTREAM` at runtime.
- In-memory mock API for `pnpm dev:mock` and the component tests.
- Non-root nginx image with a strict CSP, Trusted Types, security headers, precompressed assets, and immutable caching.
- Compose stack with the TypeScript, Go, or FastAPI example API, and end-to-end tests with axe and Lighthouse that run against all three.
