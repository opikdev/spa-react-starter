# 005. Strict CSP and Trusted Types

- **Status**: accepted
- **Context**: A Content Security Policy only stops XSS if it rules out inline scripts and styles, and Trusted Types stop DOM sinks like `innerHTML` from taking strings. Some UI libraries inject `<style>` tags or set `innerHTML`, which a strict policy blocks.
- **Decision**: Send `script-src 'self'; style-src 'self'` with no `unsafe-inline` or `unsafe-eval`, plus `require-trusted-types-for 'script'` and `trusted-types 'none'`. Use only libraries that work under it: React, TanStack, and Tailwind's static CSS do. Build dialogs on the native `<dialog>` element instead of Radix Dialog, whose scroll lock injects a `<style>` tag. The end-to-end tests fail on any CSP or Trusted Types violation.
- **Consequences**:
  - Injected markup can't run scripts, and no code can create a Trusted Types policy to get around it.
  - Dark mode follows `prefers-color-scheme`, because a theme toggle that avoids a flash needs an inline script.
  - A new library or third-party script needs a policy change and an end-to-end run.
  - The policy is set by nginx, so `pnpm dev` doesn't enforce it. Run `pnpm test:e2e` to check.
