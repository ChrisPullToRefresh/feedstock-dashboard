#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { Pool } from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.join(__dirname, "..", "migrations");

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  const sql = readFileSync(
    path.join(migrationsDir, "0001_producers_and_sequestration_sites.sql"),
    "utf8"
  );

  const pool = new Pool({ connectionString });
  try {
    await pool.query(sql);
    console.log("Migration applied: 0001_producers_and_sequestration_sites.sql");
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
