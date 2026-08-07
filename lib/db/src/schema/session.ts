import { pgTable, varchar, json, timestamp, index } from "drizzle-orm/pg-core";

// Matches connect-pg-simple's required table structure exactly (see
// node_modules/connect-pg-simple/table.sql) — this table is defined here,
// managed by drizzle-kit push like every other table, rather than relying on
// connect-pg-simple's own createTableIfMissing option.
//
// createTableIfMissing works by reading a table.sql file from disk at
// runtime, relative to its own package directory (via __dirname). That's
// incompatible with how the API server is deployed to Vercel: app.ts gets
// bundled by esbuild into a single dist-handler/app.mjs file, and esbuild's
// __dirname shim for bundled CommonJS code resolves relative to wherever the
// *bundle* ends up, not connect-pg-simple's original package directory — so
// table.sql is never actually found at runtime, and table creation silently
// fails on every cold start where the table doesn't exist yet. Defining it
// here instead means it's created the same reliable way as every other
// table, and connect-pg-simple is configured with createTableIfMissing:
// false in app.ts so it never attempts its own (broken, in this deployment)
// creation path.
export const sessionTable = pgTable(
  "session",
  {
    sid: varchar("sid").primaryKey().notNull(),
    sess: json("sess").notNull(),
    expire: timestamp("expire", { precision: 6 }).notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);
