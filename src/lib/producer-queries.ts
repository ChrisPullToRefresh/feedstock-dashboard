import type { Producer } from "@/generated/prisma/client";
import { db } from "@/lib/db";

/**
 * Reading producers.
 *
 * Separate from `producers.ts` because that module holds the zod schema the
 * client form imports, and anything reaching `db` drags the Postgres driver
 * into the browser bundle — `plan.md` § Decisions.
 */

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
