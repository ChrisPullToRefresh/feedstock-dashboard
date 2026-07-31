import { query } from "./db";

export type Direction = "in" | "out";

export interface Transaction {
  id: number;
  direction: Direction;
  weight_kg: string;
  producer_id: number | null;
  site_id: number | null;
  recorded_by: string;
  created_at: string;
}

export interface CreateTransactionInput {
  direction: Direction;
  weightKg: number;
  producerId: number | null;
  siteId: number | null;
  recordedBy: string;
}

export async function list(): Promise<Transaction[]> {
  const result = await query<Transaction>(
    "SELECT id, direction, weight_kg, producer_id, site_id, recorded_by, created_at FROM transactions ORDER BY created_at DESC"
  );
  return result.rows;
}

export async function create(
  input: CreateTransactionInput
): Promise<Transaction> {
  const result = await query<Transaction>(
    "INSERT INTO transactions (direction, weight_kg, producer_id, site_id, recorded_by) VALUES ($1, $2, $3, $4, $5) RETURNING id, direction, weight_kg, producer_id, site_id, recorded_by, created_at",
    [
      input.direction,
      input.weightKg,
      input.producerId,
      input.siteId,
      input.recordedBy,
    ]
  );
  return result.rows[0];
}
