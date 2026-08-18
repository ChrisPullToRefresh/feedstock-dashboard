import type { Prisma } from "@/generated/prisma/client";
import { Direction } from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import type { CounterpartyOption } from "@/lib/movement-data";

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
