#!/usr/bin/env bash
# Starts the school website for development (Codespaces or any machine with Docker).
# - Uses the dev container's "db" Postgres if it exists, otherwise starts Postgres in Docker.
# - Creates .env.local on first run and runs the dev server in the background.
set -u
cd "$(dirname "$0")/.."

if getent hosts db >/dev/null 2>&1; then
  DB_URL="postgres://postgres:postgres@db:5432/school"
else
  if ! command -v docker >/dev/null 2>&1; then
    echo "No database found and Docker isn't available. Rebuild the codespace (Ctrl+Shift+P → Codespaces: Rebuild Container)."
    exit 1
  fi
  if [ -z "$(docker ps -q -f name=^school-db$)" ]; then
    if [ -n "$(docker ps -aq -f name=^school-db$)" ]; then
      docker start school-db >/dev/null
    else
      echo "Starting Postgres in Docker…"
      docker run -d --name school-db --restart unless-stopped \
        -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=school \
        -p 5432:5432 -v school-pgdata:/var/lib/postgresql/data postgres:16-alpine >/dev/null
    fi
  fi
  for i in $(seq 1 30); do docker exec school-db pg_isready -U postgres -d school >/dev/null 2>&1 && break; sleep 1; done
  DB_URL="postgres://postgres:postgres@localhost:5432/school"
fi

if [ ! -f .env.local ]; then
  cat > .env.local <<ENV
# Created automatically for development. Never use these values in production.
DATABASE_URL=$DB_URL
AUTH_SECRET=$(openssl rand -base64 32 2>/dev/null || date +%s%N)
AUTH_DEV_LOGIN=true
AUTH_DEV_PASSWORD=codespace
SCHOOL_TIMEZONE=Africa/Johannesburg
ENV
  echo "Created .env.local"
elif grep -q '^DATABASE_URL=' .env.local; then
  sed -i "s#^DATABASE_URL=.*#DATABASE_URL=$DB_URL#" .env.local
else
  echo "DATABASE_URL=$DB_URL" >> .env.local
fi
echo "Using database: $DB_URL"

[ -d node_modules ] || npm ci
# The dev container sets DATABASE_URL in the environment; make sure .env.local wins.
export DATABASE_URL="$DB_URL"
for i in $(seq 1 20); do npm run db:migrate && break; echo "Waiting for database…"; sleep 3; done
pkill -f "next dev" 2>/dev/null || true
nohup npm run dev -- -H 0.0.0.0 -p 3000 > /tmp/next-dev.log 2>&1 &
echo "Dev server starting — log: /tmp/next-dev.log (first page load takes ~30s)"
