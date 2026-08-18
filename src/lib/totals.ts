import { Prisma } from "@/generated/prisma/client";
import { Direction } from "@/generated/prisma/enums";

/**
 * Running totals over movement records.
 *
 * Pure functions over arrays, with no database access: `plan.md` § Decisions
 * splits the layers so Phase 2 owns the arithmetic and Phase 6 owns the
 * querying, filtering, and display it feeds. Every sum goes through Decimal,
 * because a column of weights added as binary floats does not come back to the
 * number an operator would get on paper.
 */

/**
 * The least a record must carry to be totalled. Structural on purpose: Phase 6
 * can pass rows straight from Prisma, or a narrowed `select`, without either
 * side knowing about the other.
 */
export type MovementForTotals = {
  direction: Direction;
  weightKg: Prisma.Decimal;
  producerId: string | null;
  sequestrationSiteId: string | null;
};

const ZERO = new Prisma.Decimal(0);

const sum = (movements: readonly MovementForTotals[]): Prisma.Decimal =>
  movements.reduce<Prisma.Decimal>(
    (running, movement) => running.plus(movement.weightKg),
    ZERO,
  );

/** Everything that came into the facility, in kilograms. */
export const totalInboundKg = (
  movements: readonly MovementForTotals[],
): Prisma.Decimal =>
  sum(movements.filter((movement) => movement.direction === Direction.INBOUND));

/** Everything that left for a sequestration site, in kilograms. */
export const totalOutboundKg = (
  movements: readonly MovementForTotals[],
): Prisma.Decimal =>
  sum(
    movements.filter((movement) => movement.direction === Direction.OUTBOUND),
  );

/**
 * Totals keyed by the counterparty that matches each movement's direction.
 *
 * A movement is only ever counted against the side it actually has — the
 * database guarantees inbound carries a producer and outbound a site — so an
 * outbound row can never land under a producer, whatever it holds.
 */
function totalByCounterparty(
  movements: readonly MovementForTotals[],
  direction: Direction,
  counterpartyOf: (movement: MovementForTotals) => string | null,
): Map<string, Prisma.Decimal> {
  const totals = new Map<string, Prisma.Decimal>();

  for (const movement of movements) {
    if (movement.direction !== direction) continue;

    const key = counterpartyOf(movement);
    if (key === null) continue;

    totals.set(key, (totals.get(key) ?? ZERO).plus(movement.weightKg));
  }

  return totals;
}

/** Inbound weight per feedstock producer, keyed by producer id. */
export const totalByProducer = (
  movements: readonly MovementForTotals[],
): Map<string, Prisma.Decimal> =>
  totalByCounterparty(
    movements,
    Direction.INBOUND,
    (movement) => movement.producerId,
  );

/** Outbound weight per sequestration site, keyed by site id. */
export const totalBySequestrationSite = (
  movements: readonly MovementForTotals[],
): Map<string, Prisma.Decimal> =>
  totalByCounterparty(
    movements,
    Direction.OUTBOUND,
    (movement) => movement.sequestrationSiteId,
  );

/**
 * A counterparty a breakdown names, with the weight attributed to it.
 *
 * `isActive` rides along so an archived counterparty can be marked where it
 * appears. It is never grouped beneath the active ones: an archived producer
 * that dominated last year is not less true —
 * `specs/2026-08-18-movement-list-and-totals/plan.md` § Decisions.
 */
export type CounterpartyTotal = {
  id: string;
  name: string;
  isActive: boolean;
  totalKg: Prisma.Decimal;
};

/** The least a breakdown needs to name a counterparty. Structural, so the
 * filter option queries' rows fit without conversion. */
export type NamedCounterparty = {
  id: string;
  name: string;
  isActive: boolean;
};

/**
 * Turns one of the maps above into the rows a breakdown table renders,
 * heaviest first.
 *
 * Driven by the map rather than by the counterparty list, so a counterparty
 * that has no movements in the filtered set does not appear as a zero — the
 * breakdown answers where material came from and went to, and a name with
 * nothing behind it answers nothing.
 *
 * Ties fall back to name, so a render is not free to reorder two equal weights
 * between one page load and the next. The comparison is pinned to `en` for the
 * same reason `formatRecordedAt` avoids `Intl`: the order is asserted in a test
 * and must not move with the runtime's default locale.
 *
 * A key no counterparty names is skipped. The filter option queries return
 * every counterparty that has movements, so this cannot happen on the page; a
 * row that could not be named could not be rendered as the link the breakdown
 * requires.
 */
export function rankCounterpartyTotals(
  totals: ReadonlyMap<string, Prisma.Decimal>,
  counterparties: readonly NamedCounterparty[],
): CounterpartyTotal[] {
  const byId = new Map(counterparties.map((one) => [one.id, one]));

  const rows: CounterpartyTotal[] = [];

  for (const [id, totalKg] of totals) {
    const counterparty = byId.get(id);

    if (counterparty === undefined) continue;

    rows.push({ ...counterparty, totalKg });
  }

  return rows.sort(
    (a, b) =>
      b.totalKg.comparedTo(a.totalKg) || a.name.localeCompare(b.name, "en"),
  );
}
