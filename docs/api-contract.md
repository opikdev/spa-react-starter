# API contract

The app works with any API that behaves as described here. [`openapi.yaml`](../openapi.yaml) is the machine-readable version, and the typed client is generated from it. The browser calls `/api/...` on the app's own origin, and the proxy strips `/api`, so the API sees the paths below.

## Endpoints

| Method and path | Request | Success | Errors the app handles |
|---|---|---|---|
| `POST /v1/users` | `{ email, password }` | 201, the user | 400 with `errors`, 409 `email-taken`, 429 |
| `POST /v1/sessions` | `{ email, password, delivery: "cookie" }` | 201 `{ expiresAt }`, and sets the session cookie | 400, 401 `invalid-credentials`, 429 |
| `DELETE /v1/sessions/current` | None | 204, and clears the cookie | 401 counts as logged out |
| `GET /v1/users/me` | None | 200, the user | 401 when not logged in |
| `GET /v1/notes?limit=20&cursor=` | `cursor` from `meta.nextCursor` | 200 `{ data: Note[], meta: { limit, nextCursor } }`, newest first | 401, 429 |
| `POST /v1/notes` | `{ title, body }`, `Idempotency-Key` header | 201, the note | 400 with `errors`, 401, 422, 429 |
| `GET /v1/notes/{id}` | None | 200, the note, with an `ETag` header | 401, 404 `not-found`, 429 |
| `PATCH /v1/notes/{id}` | `{ title, body }`, `If-Match` header | 200, the note, with a new `ETag` | 400, 401, 404, 412 `version-mismatch`, 429 |
| `DELETE /v1/notes/{id}` | None | 204 | 401, 404, 429 |

- A user is `{ id, email, createdAt }`. A note is `{ id, title, body, version, createdAt, updatedAt }`. Timestamps are ISO 8601 in UTC.
- `title` is 1 to 200 characters, `body` at most 10,000, `email` at most 254, and `password` 12 to 128. The forms check the same limits before sending.
- `nextCursor` is `null` on the last page.

## Sessions

- `POST /v1/sessions` with `delivery: "cookie"` sets `__Host-session` with `HttpOnly`, `Secure`, `SameSite=Strict`, and `Path=/`. The response body has no token.
- The browser sends the cookie on every same-origin request. The app never reads or stores it.
- A request that changes data and comes from another site gets 403 `forbidden`. The app's requests are same-origin, so it never sees one.
- Browsers treat `http://localhost` as secure, so the cookie works locally. Every other host needs HTTPS in front of the app.

## Retries and concurrency

- `POST /v1/notes` replays the original response when it gets an `Idempotency-Key` it has seen with the same body, and returns 422 `idempotency-key-reused` for a different body. The app sends a new key for each new note, and the same key when it retries the same note.
- `GET` and `PATCH` return the note's version in `ETag`. `PATCH` without `If-Match` gets 428, and with a stale one gets 412. On 412 the app offers to load the latest version or overwrite it.

## Errors

Every error is `application/problem+json` per [RFC 9457](https://www.rfc-editor.org/rfc/rfc9457), and the app switches on `type`:

```json
{
  "type": "urn:problem:validation-failed",
  "title": "Request validation failed",
  "status": 400,
  "detail": "The request has invalid fields.",
  "instance": "/v1/notes",
  "errors": [{ "field": "title", "detail": "Too small: expected string to have >=1 characters" }]
}
```

| Type | How the app shows it |
|---|---|
| `urn:problem:validation-failed` | Each `errors` item on the form field named by `field`, or the form's message if no field matches |
| `urn:problem:invalid-credentials` | A message to check the email and password |
| `urn:problem:unauthorized` | Sends the user to log in, then back |
| `urn:problem:email-taken` | A message on the email field |
| `urn:problem:not-found` | The note's not found page |
| `urn:problem:version-mismatch` | The conflict dialog |
| `urn:problem:forbidden` | A message to reload and retry |
| Any 429 | When to retry, from the `Retry-After` header in seconds |
| Any 5xx or unknown type | The `detail`, or a retry message for 5xx, plus the `X-Request-Id` to quote |

Every response should carry `X-Request-Id`, so users can quote it when something fails.
