import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

type DB = PostgresJsDatabase<typeof schema>;

const globalForDb = globalThis as unknown as { __db?: DB };

function create(): DB {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  // prepare:false keeps us compatible with Supabase's transaction pooler (port 6543).
  const client = postgres(url, { prepare: false, max: Number(process.env.DB_POOL_MAX ?? 10) });
  return drizzle(client, { schema });
}

/** Lazily created so `next build` never needs a database. */
export const db: DB = new Proxy({} as DB, {
  get(_t, prop) {
    globalForDb.__db ??= create();
    return Reflect.get(globalForDb.__db, prop, globalForDb.__db);
  },
});

export { schema };
