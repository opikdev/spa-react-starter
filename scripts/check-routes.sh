#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."

tree=src/routeTree.gen.ts
current=$(mktemp)
trap 'cp "$current" "$tree"; rm -f "$current"' EXIT
cp "$tree" "$current"

pnpm exec tsr generate
if ! diff -q "$current" "$tree" >/dev/null; then
  echo "$tree is out of date with src/routes/. Run pnpm gen:routes and commit the result." >&2
  exit 1
fi
echo 'Route tree matches src/routes/'
