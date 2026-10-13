// Applies SQL migrations in ./drizzle. Runs automatically when the Docker container starts.
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

// Load .env.local / .env when run outside Docker (Next.js does this itself; plain Node doesn't).
for (const f of [".env.local", ".env"]) {
  try {
    process.loadEnvFile(f);
  } catch {}
}

const url = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL (or DIRECT_URL) is not set");
  process.exit(1);
}
const client = postgres(url, { max: 1, prepare: false, onnotice: () => {} });
try {
  await migrate(drizzle(client), { migrationsFolder: new URL("../drizzle", import.meta.url).pathname });
  console.log("Migrations applied");
} finally {
  await client.end();
}
