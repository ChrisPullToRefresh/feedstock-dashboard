import { z } from "zod";

import type { Producer } from "@/generated/prisma/client";
import { db } from "@/lib/db";

/**
 * What a feedstock producer's name may be, and how to read the list.
 *
 * The schema is the single one — `plan.md` § Decisions. The browser runs it for
 * immediate feedback and the Server Action runs it again before touching the
 * database, because a Server Action is a public endpoint and the server copy is
 * the one that counts.
 */

/** Keeps the list and Phase 5's dropdown readable on a phone. */
export const PRODUCER_NAME_MAX_LENGTH = 100;

export const producerNameSchema = z
  .string()
  // Trimmed before the length checks, so " Acme " and "Acme" cannot become two
  // rows that look identical on screen and defeat the unique constraint.
  .trim()
  .min(1, "Enter a producer name")
  .max(
    PRODUCER_NAME_MAX_LENGTH,
    `Use ${PRODUCER_NAME_MAX_LENGTH} characters or fewer`,
  );

export const producerSchema = z.object({ name: producerNameSchema });

export type ProducerInput = z.infer<typeof producerSchema>;

/**
 * The producers the list shows: active only, by name.
 *
 * Archived producers appear on no screen — `plan.md` § Decisions — so this is
 * the only listing the app has.
 */
export function listActiveProducers(): Promise<Producer[]> {
  return db.producer.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });
}

export function findProducer(id: string): Promise<Producer | null> {
  return db.producer.findUnique({ where: { id } });
}

/**
 * Finds a producer by name ignoring case, archived ones included — which is
 * what makes the restore offer possible.
 *
 * Matched through `lower(name)` rather than Prisma's `mode: "insensitive"`,
 * which compiles to `ILIKE`: a producer named `50% Farm` would then match
 * names it should not. This also reads the unique index the migration added.
 */
export async function findProducerByName(
  name: string,
): Promise<Producer | null> {
  const rows = await db.$queryRaw<{ id: string }[]>`
    SELECT id FROM producers WHERE lower(name) = lower(${name}) LIMIT 1
  `;

  const id = rows[0]?.id;

  return id === undefined ? null : findProducer(id);
}
