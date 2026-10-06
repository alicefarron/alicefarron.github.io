#!/usr/bin/env bash
set -euo pipefail

image="${IMAGE:-alina-os-smoke}"
name="${CONTAINER:-alina-os-smoke}"
port="${PORT:-8080}"
content_dir="${CONTENT_DIR:-tests/fixtures/content}"
base="http://localhost:${port}"
failures=0

cleanup() {
	docker rm --force "$name" >/dev/null 2>&1 || true
}
trap cleanup EXIT

pass() { printf 'ok    %s\n' "$1"; }
fail() { printf 'FAIL  %s\n' "$1"; failures=$((failures + 1)); }

docker build --build-arg "CONTENT_DIR=${content_dir}" --tag "$image" .
cleanup
docker run --detach --name "$name" --publish "${port}:8080" "$image" >/dev/null

for _ in $(seq 1 30); do
	if curl --silent --output /dev/null "$base/"; then
		break
	fi
	sleep 1
done

status=$(curl --silent --output /dev/null --write-out '%{http_code}' "$base/")
if [ "$status" = "200" ]; then pass "/ returns 200"; else fail "/ returned $status"; fi

status=$(curl --silent --output /dev/null --write-out '%{http_code}' "$base/about")
if [ "$status" = "200" ]; then pass "/about returns 200"; else fail "/about returned $status"; fi

body=$(mktemp)
status=$(curl --silent --output "$body" --write-out '%{http_code}' "$base/missing")
if [ "$status" = "404" ]; then pass "/missing returns 404"; else fail "/missing returned $status"; fi
if grep -q "The page could not be found." "$body"; then pass "/missing serves the custom 404 page"; else fail "/missing body is not the custom 404 page"; fi
rm -f "$body"

asset=$(curl --silent "$base/" | grep -o '/_astro/[^"]*\.css' | head -n 1 || true)
if [ -z "$asset" ]; then
	fail "no /_astro/ stylesheet linked from /"
else
	cache=$(curl --silent --head "$base$asset" | tr -d '\r' | grep -i '^cache-control:' | cut -d' ' -f2- || true)
	if [ "$cache" = "public, max-age=31536000, immutable" ]; then
		pass "$asset has the immutable one-year cache header"
	else
		fail "$asset Cache-Control was '$cache'"
	fi
fi

cache=$(curl --silent --head "$base/" | tr -d '\r' | grep -i '^cache-control:' | cut -d' ' -f2- || true)
if [ "$cache" = "public, max-age=0, must-revalidate" ]; then pass "/ revalidates"; else fail "/ Cache-Control was '$cache'"; fi

if [ "$failures" -gt 0 ]; then
	printf '%s check(s) failed\n' "$failures"
	exit 1
fi
printf 'docker smoke: all checks passed\n'
