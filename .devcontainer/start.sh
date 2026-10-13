#!/usr/bin/env bash
# Starts the dev server in the background so the site is up even if no terminal is attached.
cd "$(dirname "$0")/.."
[ -d node_modules ] || npm ci
for i in $(seq 1 20); do npm run db:migrate && break; echo "Waiting for database…"; sleep 3; done
pkill -f "next dev" 2>/dev/null || true
nohup npm run dev -- -H 0.0.0.0 -p 3000 > /tmp/next-dev.log 2>&1 &
echo "Dev server starting — log: /tmp/next-dev.log"
