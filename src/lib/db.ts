import { Pool } from "pg";
import { attachDatabasePool } from "@vercel/functions";

function createPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set");
  }
  return new Pool({ connectionString });
}

// Created once at module scope; reused across requests handled by the same
// Fluid Compute instance. attachDatabasePool lets Vercel drain idle
// connections before the instance suspends.
const pool = createPool();
attachDatabasePool(pool);

export async function healthCheck(): Promise<boolean> {
  const result = await pool.query("SELECT 1");
  return result.rowCount === 1;
}
