import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// `max` is kept low deliberately: on Vercel, every serverless function
// instance gets its own pool, and many instances can run concurrently under
// load. A small per-instance cap avoids exhausting the connection limit on
// the database side. If you're using Neon, also make sure DATABASE_URL is
// the *pooled* connection string (the one with "-pooler" in the hostname)
// rather than the direct one, since that also fans out through PgBouncer.
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
});
export const db = drizzle(pool, { schema });

export * from "./schema";
