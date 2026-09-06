#!/usr/bin/env bash
# Dijalankan DI VPS oleh GitHub Actions. Argumen 1: commit SHA (= tag image di GHCR).
# Tidak ada build di sini: image sudah jadi, VPS cuma pull + swap container.
set -euo pipefail

cd "$(dirname "$0")/.."
SHA="${1:?commit SHA wajib diisi}"

# Compose file ikut versi commit-nya, supaya rollback juga mengembalikan konfigurasi.
git fetch --prune origin
git reset --hard "$SHA"

export IMAGE_TAG="$SHA"
export APP_PORT="${APP_PORT:-3001}"
COMPOSE=(docker compose -f deploy/docker-compose.yml)

"${COMPOSE[@]}" pull
"${COMPOSE[@]}" up -d --remove-orphans

for _ in $(seq 1 30); do
  if curl -fsS -o /dev/null "http://127.0.0.1:${APP_PORT}/login"; then
    echo "Deploy OK: $SHA"
    docker image prune -f --filter "until=168h" >/dev/null || true
    exit 0
  fi
  sleep 2
done

echo "App tidak merespons setelah container di-restart" >&2
"${COMPOSE[@]}" logs --tail 50 app >&2
exit 1
