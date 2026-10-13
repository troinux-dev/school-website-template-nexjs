#!/usr/bin/env bash
# Starts the dev server in the background so the site is up even if no terminal is attached.
cd "$(dirname "$0")/.."

# Create .env.local with Codespaces defaults on first run (never overwrites yours).
if [ ! -f .env.local ]; then
  cat > .env.local <<ENV
# Created automatically for Codespaces. Development only.
DATABASE_URL=postgres://postgres:postgres@db:5432/school
AUTH_SECRET=$(openssl rand -base64 32 2>/dev/null || date +%s%N)
AUTH_DEV_LOGIN=true
AUTH_DEV_PASSWORD=codespace
SCHOOL_TIMEZONE=Africa/Johannesburg
ENV
  echo "Created .env.local"
fi

[ -d node_modules ] || npm ci
for i in $(seq 1 20); do npm run db:migrate && break; echo "Waiting for database…"; sleep 3; done
pkill -f "next dev" 2>/dev/null || true
nohup npm run dev -- -H 0.0.0.0 -p 3000 > /tmp/next-dev.log 2>&1 &
echo "Dev server starting — log: /tmp/next-dev.log"
