#!/usr/bin/env bash
# Starts the school website for development (Codespaces or any machine).
# Database, in order of preference:
#   1. the dev container's "db" Postgres service
#   2. Postgres in Docker (if Docker is running)
#   3. PGlite — an embedded Postgres from npm (no Docker needed; data kept in .pgdata/)
set -u
cd "$(dirname "$0")/.."

[ -d node_modules/@electric-sql/pglite-socket ] || npm ci

POOL=10
if getent hosts db >/dev/null 2>&1; then
  echo "Database: dev-container Postgres"
  DB_URL="postgres://postgres:postgres@db:5432/school"
elif docker info >/dev/null 2>&1; then
  echo "Database: Postgres in Docker"
  if [ -z "$(docker ps -q -f name=^school-db$)" ]; then
    if [ -n "$(docker ps -aq -f name=^school-db$)" ]; then
      docker start school-db >/dev/null
    else
      docker run -d --name school-db --restart unless-stopped \
        -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=school \
        -p 5432:5432 -v school-pgdata:/var/lib/postgresql/data postgres:16-alpine >/dev/null
    fi
  fi
  for i in $(seq 1 30); do docker exec school-db pg_isready -U postgres -d school >/dev/null 2>&1 && break; sleep 1; done
  DB_URL="postgres://postgres:postgres@127.0.0.1:5432/school"
else
  echo "Database: PGlite (embedded Postgres, data in .pgdata/)"
  if ! (echo > /dev/tcp/127.0.0.1/5433) 2>/dev/null; then
    setsid nohup npx pglite-server --db=.pgdata --port=5433 --max-connections=8 > /tmp/pglite.log 2>&1 &
  fi
  for i in $(seq 1 30); do (echo > /dev/tcp/127.0.0.1/5433) 2>/dev/null && break; sleep 1; done
  DB_URL="postgres://postgres:postgres@127.0.0.1:5433/postgres"
  POOL=1
fi

if [ ! -f .env.local ]; then
  cat > .env.local <<ENV
# Created automatically for development. Never use these values in production.
AUTH_SECRET=$(openssl rand -base64 32 2>/dev/null || date +%s%N)
AUTH_DEV_LOGIN=true
AUTH_DEV_PASSWORD=codespace
SCHOOL_TIMEZONE=Africa/Johannesburg
ENV
  echo "Created .env.local"
fi
# Point .env.local at the database chosen above.
sed -i '/^DATABASE_URL=/d;/^DB_POOL_MAX=/d' .env.local
printf 'DATABASE_URL=%s\nDB_POOL_MAX=%s\n' "$DB_URL" "$POOL" >> .env.local
export DATABASE_URL="$DB_URL" DB_POOL_MAX="$POOL"

# Stop a dev server this script started earlier.
[ -f /tmp/next-dev.pid ] && kill -- -"$(cat /tmp/next-dev.pid)" 2>/dev/null; sleep 1
for i in $(seq 1 10); do npm run db:migrate && break; echo "Waiting for database…"; sleep 3; done
setsid nohup npm run dev -- -H 0.0.0.0 -p 3000 > /tmp/next-dev.log 2>&1 &
echo $! > /tmp/next-dev.pid
echo "Dev server starting — log: /tmp/next-dev.log (first page load takes ~30s)"
