# Operations

The image is nginx serving the built app, with `/api/` proxied to your API. It runs as a non-root user, works on a read-only filesystem with a `tmpfs` at `/tmp`, and listens on port 8080.

## Configuration

| Variable | Type | Default | Description |
|---|---|---|---|
| `API_UPSTREAM` | URL | None, required | The API's base URL: scheme, host, and optional port, with no path. The container exits with a message if it's missing or has a path |

`/api/` re-resolves the API's hostname every 10 seconds with the container's DNS servers, so it follows a service whose address changes. Build-time `VITE_` variables are the only values that reach the browser, so never put secrets in them. `pnpm check:bundle` fails if `API_UPSTREAM` ends up in the bundle.

## Endpoints

| Path | Response |
|---|---|
| `/healthz` | 200 `ok`, for liveness and readiness checks |
| `/api/*` | Proxied to `API_UPSTREAM` without the `/api` prefix |
| `/assets/*` | Hashed files with `Cache-Control: public, max-age=31536000, immutable`, or 404 |
| Other paths with a file extension | The file with `Cache-Control: no-cache`, or 404 |
| Any other path | `index.html` with `Cache-Control: no-cache`, so the app's router handles it |

Text assets are gzipped at build time and served with `gzip_static`. The stock nginx image has no Brotli module, so the build doesn't make Brotli files.

## Security headers

Every response, including proxied API responses, gets these headers. nginx drops the API's own copies so each header appears once.

| Header | Value |
|---|---|
| `Content-Security-Policy` | `default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; font-src 'self'; object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'; require-trusted-types-for 'script'; trusted-types 'none'` |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains` |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | Denies accelerometer, camera, geolocation, gyroscope, magnetometer, microphone, payment, and USB |
| `Cross-Origin-Opener-Policy` | `same-origin` |
| `Cross-Origin-Resource-Policy` | `same-origin` |

To load something from another origin, such as an error tracker, add it to the matching directive in `docker/nginx/security-headers.conf`. The end-to-end tests fail on any CSP or Trusted Types violation, so run `pnpm test:e2e` after the change. [Decision 005](decisions/005-strict-csp-and-trusted-types.md) explains the policy.

## Proxies and TLS

- Terminate TLS in front of the container. HSTS and the `Secure` cookie need HTTPS on every host but `localhost`.
- nginx appends the client's address to `X-Forwarded-For` and sets `X-Forwarded-Proto` and `X-Forwarded-Host`. Set the API to trust one hop for nginx, plus one for each load balancer in front of it.
- nginx passes the browser's `Host` header through, because the API's cross-site check compares it with `Origin`.
- An `https://` upstream gets its certificate verified against the system CA bundle.

## Report errors

`reportError` in `src/lib/reporting.ts` receives every error a route or React fails to handle. It logs to the console by default. Replace its body with your error tracker's capture call, and allow the tracker's origin in `connect-src`.
