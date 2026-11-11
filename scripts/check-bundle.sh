#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."

errors=0
if [[ -e dist/mockServiceWorker.js ]]; then
  echo 'dist/ contains mockServiceWorker.js. Mocks must only load in mock mode.' >&2
  errors=1
fi
if grep -rlq --include='*.js' -e 'demo-password-123' -e 'msw' dist/assets; then
  echo 'dist/assets contains mock code. Import src/mocks/ only behind the mock mode check.' >&2
  errors=1
fi
if grep -rlq --include='*.js' -e 'API_UPSTREAM' dist/assets; then
  echo 'dist/assets mentions API_UPSTREAM. Only VITE_ variables may reach the bundle.' >&2
  errors=1
fi
((errors == 0)) && echo 'Bundle has no mocks or server settings'
exit "$errors"
