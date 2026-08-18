import type { Prisma } from "@/generated/prisma/client";
import { Direction } from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import type { CounterpartyOption, MovementFilters } from "@/lib/movement-data";
import type { MovementForTotals } from "@/lib/totals";

/**
 * Reading counterparties and writing movements.
 *
 * Separate from `movement-data.ts` because that module holds the zod schema the
 * client form imports, and anything reaching `db` drags the Postgres driver
 * into the browser bundle — `specs/2026-08-17-movement-entry/plan.md`
 * § Decisions.
 *
 * The dropdown listings are not here: `listActiveProducers` and
 * `listActiveSites` already exist in `producer-queries.ts` and
 * `site-queries.ts`, and the routes read them directly.
 */

/**
 * Resolves a submitted counterparty id to the *active* row it names, or null.
 *
 * The dropdowns only ever offer active rows, but a form opened before someone
 * archives a counterparty still holds that id, and a Server Action is a public
 * endpoint — so this is the copy that counts. Archived is treated exactly like
 * nonexistent: neither may take on new weight.
 *
 * `findFirst` rather than `findUnique`: the id alone is unique, but the
 * question being asked is "unique *and* still active", which is not.
 */
export async function findActiveCounterparty(
  direction: Direction,
  id: string,
): Promise<CounterpartyOption | null> {
  const where = { id, isActive: true };
  const select = { id: true, name: true };

  return direction === Direction.INBOUND
    ? db.producer.findFirst({ where, select })
    : db.sequestrationSite.findFirst({ where, select });
}

/**
 * Appends one movement.
 *
 * The counterparty goes in the column matching the direction and the other is
 * left null, which is what Phase 2's check constraint requires — inbound from a
 * producer, outbound to a sequestration site. `recordedAt` comes from the
 * column's own `now()`; `plan.md` § Decisions keeps it off the form, and
 * `requirements.md` § Open questions carries what that costs.
 *
 * There is no update counterpart and never will be. The trigger in Phase 2's
 * migration refuses an UPDATE outright — `specs/mission.md` § Constraints makes
 * a movement correctable only by recording an adjusting entry.
 */
export function recordMovement({
  direction,
  weightKg,
  counterpartyId,
}: {
  direction: Direction;
  weightKg: Prisma.Decimal;
  counterpartyId: string;
}): Promise<{ id: string }> {
  return db.movement.create({
    data: {
      direction,
      weightKg,
      ...(direction === Direction.INBOUND
        ? { producerId: counterpartyId }
        : { sequestrationSiteId: counterpartyId }),
    },
    select: { id: true },
  });
}

/**
 * What the movement list and the detail pages read off a movement.
 *
 * Both counterparties are selected because a row carries exactly one of them —
 * Phase 2's check constraint — and which one is decided by `direction` rather
 * than by the query. Each carries `isActive`, so an archived counterparty can
 * be named and marked wherever it appears.
 */
const LISTED_MOVEMENT_SELECT = {
  id: true,
  direction: true,
  weightKg: true,
  recordedAt: true,
  producer: { select: { id: true, name: true, isActive: true } },
  sequestrationSite: { select: { id: true, name: true, isActive: true } },
} satisfies Prisma.MovementSelect;

export type ListedMovement = Prisma.MovementGetPayload<{
  select: typeof LISTED_MOVEMENT_SELECT;
}>;

/**
 * The three filters, as a `where`.
 *
 * An unset filter contributes nothing rather than a null comparison, so the
 * unfiltered list reads the whole table and a filtered one narrows it. Both
 * movement queries share this, which is what stops the table and the totals
 * describing different sets of rows.
 */
function movementWhere(filters: MovementFilters): Prisma.MovementWhereInput {
  return {
    ...(filters.direction !== null ? { direction: filters.direction } : {}),
    ...(filters.producerId !== null ? { producerId: filters.producerId } : {}),
    ...(filters.sequestrationSiteId !== null
      ? { sequestrationSiteId: filters.sequestrationSiteId }
      : {}),
  };
}

/**
 * The movements the table shows, newest first.
 *
 * Reads one row more than the page displays, so whether a **Show more**
 * control belongs is answered by this query rather than by a second count —
 * `specs/2026-08-18-movement-list-and-totals/plan.md` § Decisions. The caller
 * renders `limit` rows and reads the extra one as "there are more".
 *
 * The id breaks a tie on `recordedAt`. Two movements written in the same
 * instant would otherwise come back in whatever order Postgres found them,
 * which across a **Show more** round trip is how a row gets shown twice or
 * skipped entirely.
 */
export function listMovements(
  filters: MovementFilters,
): Promise<ListedMovement[]> {
  return db.movement.findMany({
    where: movementWhere(filters),
    orderBy: [{ recordedAt: "desc" }, { id: "desc" }],
    take: filters.limit + 1,
    select: LISTED_MOVEMENT_SELECT,
  });
}

/**
 * Every row the filters match, in the four columns the arithmetic reads.
 *
 * Separate from `listMovements` because the totals describe the filtered set
 * and not the page — `plan.md` § Decisions. Summing only the loaded rows would
 * move both figures every time someone tapped **Show more**, which is not what
 * a running total means.
 *
 * The projection is exactly `MovementForTotals`, the shape `totals.ts` declared
 * in Phase 2 against the day this phase would feed it. There is no `take`: the
 * cap bounds the table, and only this narrow select bounds the cost of the
 * sum.
 */
export function listMovementsForTotals(
  filters: MovementFilters,
): Promise<MovementForTotals[]> {
  return db.movement.findMany({
    where: movementWhere(filters),
    select: {
      direction: true,
      weightKg: true,
      producerId: true,
      sequestrationSiteId: true,
    },
  });
}
