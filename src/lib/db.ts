import { Pool } from "pg";
import { attachDatabasePool } from "@vercel/functions";

// Created lazily on first use (not at module load) so importing this module
// — e.g. during `next build`'s page-data collection — doesn't require
// DATABASE_URL to be set. Reused across requests handled by the same Fluid
// Compute instance once created; attachDatabasePool lets Vercel drain idle
// connections before the instance suspends.
let pool: Pool | undefined;

function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL environment variable is not set");
    }
    pool = new Pool({ connectionString });
    attachDatabasePool(pool);
  }
  return pool;
}

export async function healthCheck(): Promise<boolean> {
  const result = await getPool().query("SELECT 1");
  return result.rowCount === 1;
}
