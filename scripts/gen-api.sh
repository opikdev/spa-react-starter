#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."

if [[ -z ${API_SCHEMA:-} && -f .env ]]; then
  API_SCHEMA=$(sed -n 's/^API_SCHEMA=//p' .env | tail -n 1)
fi
schema=${API_SCHEMA:-openapi.yaml}
output=${1:-src/lib/api/schema.d.ts}

if [[ $schema =~ ^https?:// ]]; then
  curl --fail --silent --show-error --location "$schema" --output openapi.yaml
elif [[ $schema != openapi.yaml ]]; then
  cp "$schema" openapi.yaml
fi

pnpm exec openapi-typescript openapi.yaml --output "$output" >/dev/null
