import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required for Drizzle CLI commands");
}

export default defineConfig({
  schema: ["./lib/db/schema.ts", "./lib/db/extended-schema.ts", "./lib/db/frontier-schema.ts"],
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL },
  strict: true,
  verbose: true,
});
