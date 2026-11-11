#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."

generated=$(mktemp)
trap 'rm -f "$generated"' EXIT

API_SCHEMA=openapi.yaml scripts/gen-api.sh "$generated"
if ! diff -q "$generated" src/lib/api/schema.d.ts >/dev/null; then
  echo 'src/lib/api/schema.d.ts is out of date with openapi.yaml. Run pnpm gen:api and commit the result.' >&2
  exit 1
fi
echo 'API types match openapi.yaml'
