#!/bin/sh
set -eu

fail() {
  echo "$1" >&2
  exit 1
}

[ -n "${API_UPSTREAM:-}" ] ||
  fail 'API_UPSTREAM is not set. Set it to the base URL of your API, such as http://api:3000.'

case "$API_UPSTREAM" in
  http://* | https://*) ;;
  *) fail "API_UPSTREAM must start with http:// or https://, but it is \"$API_UPSTREAM\"." ;;
esac

case "${API_UPSTREAM#*://}" in
  */* | '') fail "API_UPSTREAM must be a scheme, host, and optional port with no path, but it is \"$API_UPSTREAM\"." ;;
esac

mkdir -p /tmp/conf.d
