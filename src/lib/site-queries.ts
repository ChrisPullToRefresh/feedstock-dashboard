import type { SequestrationSite } from "@/generated/prisma/client";
import { db } from "@/lib/db";

/**
 * Reading sequestration sites.
 *
 * Written to the same shape as `producer-queries.ts` rather than generalized
 * with it — `specs/2026-08-16-sequestration-sites/plan.md` § Decisions. Prisma's
 * delegates are separate types, so a factory would thread generics through the
 * code that decides what gets written, to save duplication in code that is
 * already short.
 *
 * Separate from `reference-data.ts` because that module holds the zod schemas
 * the client forms import, and anything reaching `db` drags the Postgres driver
 * into the browser bundle.
 */

/**
 * The sites the list shows: active only, by name.
 *
 * Archived sites appear on no screen — `plan.md` § Decisions — so this is the
 * only listing the app has.
 */
export function listActiveSites(): Promise<SequestrationSite[]> {
  return db.sequestrationSite.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });
}

export function findSite(id: string): Promise<SequestrationSite | null> {
  return db.sequestrationSite.findUnique({ where: { id } });
}

/**
 * Finds a site by name ignoring case, archived ones included — which is what
 * makes the restore offer possible.
 *
 * Matched through `lower(name)` rather than Prisma's `mode: "insensitive"`,
 * which compiles to `ILIKE`: a site named `50% Basin` would then match names it
 * should not. This also reads the unique index the migration added.
 */
export async function findSiteByName(
  name: string,
): Promise<SequestrationSite | null> {
  const rows = await db.$queryRaw<{ id: string }[]>`
    SELECT id FROM sequestration_sites WHERE lower(name) = lower(${name}) LIMIT 1
  `;

  const id = rows[0]?.id;

  return id === undefined ? null : findSite(id);
}
