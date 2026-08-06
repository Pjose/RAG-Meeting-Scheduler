import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

export default defineConfig({
  // A plain relative path (resolved by drizzle-kit relative to this config
  // file) rather than path.join(__dirname, ...) — path.join produces
  // backslashes on Windows, which drizzle-kit's internal path resolution
  // doesn't handle correctly, causing a false "please make sure to use .ts
  // or other extension in the path" error even though the path is valid.
  schema: "./src/schema/index.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});

