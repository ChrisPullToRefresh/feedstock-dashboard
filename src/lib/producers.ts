import { query } from "./db";

export interface Producer {
  id: number;
  name: string;
  created_at: string;
}

export async function list(): Promise<Producer[]> {
  const result = await query<Producer>(
    "SELECT id, name, created_at FROM producers ORDER BY name"
  );
  return result.rows;
}

export async function create(name: string): Promise<Producer> {
  const result = await query<Producer>(
    "INSERT INTO producers (name) VALUES ($1) RETURNING id, name, created_at",
    [name]
  );
  return result.rows[0];
}
