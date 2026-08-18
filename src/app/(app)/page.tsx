import { MovementBreakdown } from "@/components/movement-breakdown";
import { NoMovementsMatch, NoMovementsYet } from "@/components/movement-empty";
import { MovementFilters } from "@/components/movement-filters";
import { MovementList } from "@/components/movement-list";
import { MovementTotals } from "@/components/movement-totals";
import { ShowMore } from "@/components/show-more";
import {
  pageAtLimit,
  parseMovementFilters,
  type MovementSearchParams,
} from "@/lib/movement-data";
import {
  listMovements,
  listMovementsForTotals,
  listProducersWithMovements,
  listSitesWithMovements,
} from "@/lib/movement-queries";
import {
  rankCounterpartyTotals,
  totalByProducer,
  totalBySequestrationSite,
} from "@/lib/totals";

/**
 * The movement list, which is what a signed-in manager lands on.
 *
 * `NAV_DESTINATIONS` has pointed `/` at "Movements" since Phase 0, and this
 * phase fills it in — `specs/2026-08-18-movement-list-and-totals/plan.md`
 * § Decisions. A named `/movements` route was declined: it leaves `/` needing
 * something else and reworks the `/` special case in `isActiveDestination`;
 * `/movements` with `/` redirecting to it was declined as an extra hop on
 * every visit to the home screen and two addresses for one page.
 *
 * Four blocks in order: the filters, the totals for whatever they select, the
 * table newest first, and the two breakdowns. Everything the roadmap's totals
 * bullet asks for is on one page.
 *
 * The cost accepted: the app's landing page on a phone is the review surface
 * rather than the entry surface, on a phone-first product. **Record** is one
 * tap away in the tab bar.
 */

/**
 * Rendered per request, never prerendered.
 * `specs/2026-08-16-sequestration-sites/plan.md` § Decisions binds this
 * forward to every page that reads the database, and this one reads four
 * queries and its own search parameters.
 */
export const dynamic = "force-dynamic";

export default async function MovementsPage({
  searchParams,
}: {
  searchParams: Promise<MovementSearchParams>;
}) {
  // The dropdowns first, because they are also what resolves a counterparty id
  // in the URL: an id nobody offers is treated as unset rather than as a
  // filter matching nothing.
  const [raw, producers, sites] = await Promise.all([
    searchParams,
    listProducersWithMovements(),
    listSitesWithMovements(),
  ]);

  const options = { producers, sites };
  const filters = parseMovementFilters(raw, options);

  // Two queries, deliberately. The table gets the newest `limit + 1` rows; the
  // arithmetic gets every row the filters match, so the totals do not move
  // when Show more does — plan.md § Decisions.
  const [returned, everyMatchingRow] = await Promise.all([
    listMovements(filters),
    listMovementsForTotals(filters),
  ]);

  const { visible, hasMore } = pageAtLimit(returned, filters.limit);

  // Nothing recorded at all is a different situation from filters that reach
  // nothing, because the two do not have the same way out. Which one applies
  // is decided by the dropdowns: they list every counterparty that has
  // movements, so both being empty means the table is.
  const facilityHasMovements = producers.length > 0 || sites.length > 0;

  return (
    <section className="mx-auto max-w-5xl">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Movements</h1>

      {!facilityHasMovements ? (
        <NoMovementsYet />
      ) : (
        <>
          <MovementFilters filters={filters} options={options} />
          <MovementTotals movements={everyMatchingRow} />

          {visible.length === 0 ? (
            <NoMovementsMatch />
          ) : (
            <>
              <MovementList movements={visible} />
              {hasMore ? <ShowMore filters={filters} /> : null}
            </>
          )}

          <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-2">
            <MovementBreakdown
              heading="Inbound by producer"
              columnLabel="Producer"
              rows={rankCounterpartyTotals(
                totalByProducer(everyMatchingRow),
                producers,
              )}
              basePath="/producers"
              emptyMessage="No inbound movements match these filters."
            />
            <MovementBreakdown
              heading="Outbound by sequestration site"
              columnLabel="Sequestration site"
              rows={rankCounterpartyTotals(
                totalBySequestrationSite(everyMatchingRow),
                sites,
              )}
              basePath="/sites"
              emptyMessage="No outbound movements match these filters."
            />
          </div>
        </>
      )}
    </section>
  );
}
