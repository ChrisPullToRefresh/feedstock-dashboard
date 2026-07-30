import { query } from "./db";

export interface SequestrationSite {
  id: number;
  name: string;
  created_at: string;
}

export async function list(): Promise<SequestrationSite[]> {
  const result = await query<SequestrationSite>(
    "SELECT id, name, created_at FROM sequestration_sites ORDER BY name"
  );
  return result.rows;
}

export async function create(name: string): Promise<SequestrationSite> {
  const result = await query<SequestrationSite>(
    "INSERT INTO sequestration_sites (name) VALUES ($1) RETURNING id, name, created_at",
    [name]
  );
  return result.rows[0];
}
