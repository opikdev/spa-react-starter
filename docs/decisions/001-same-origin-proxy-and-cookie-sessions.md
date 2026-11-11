# 001. Same-origin proxy and cookie sessions

- **Status**: accepted
- **Context**: A bearer token kept in JavaScript or storage is stolen by any XSS bug. Cookies avoid that, but cross-origin cookies need CORS with credentials and CSRF defenses, and a build-time API URL ties each image to one environment.
- **Decision**: The browser always calls `/api/*` on the app's own origin. Vite in development and nginx in the image proxy it to `API_UPSTREAM`, stripping `/api`. Login asks for `delivery: "cookie"`, so the API sets an `HttpOnly`, `Secure`, `SameSite=Strict` `__Host-session` cookie that the browser sends on every call.
- **Consequences**:
  - No token in JavaScript, storage, or URLs, so an XSS bug can act as the user while the page is open but can't steal the session.
  - No CORS: `connect-src 'self'` is enough, and `SameSite=Strict` plus the API's cross-site check block CSRF.
  - One image serves every environment, because the API's location is a runtime setting.
  - The API must accept cookie sessions and trust one more proxy hop for client IPs.
  - Hosts other than `localhost` need HTTPS, because the cookie is `Secure`.
