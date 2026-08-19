import { notFound } from "next/navigation";

import { archiveProducer } from "@/app/(app)/producers/actions";
import { ReferenceDetail } from "@/components/reference-detail";
import { Direction } from "@/generated/prisma/enums";
import { filterHref, NO_FILTERS } from "@/lib/movement-data";
import {
  listMovementsForCounterpartyTotals,
  listRecentMovementsFor,
} from "@/lib/movement-queries";
import { findProducer } from "@/lib/producer-queries";
import { totalInboundKg } from "@/lib/totals";

/**
 * A producer's page: its own query, its own `notFound`, its own archive action
 * and its own words, over the shared `ReferenceDetail` —
 * `specs/2026-08-18-movement-list-and-totals/plan.md` § Decisions.
 *
 * A single dynamic `/[entity]/[id]` route was declined: it rewrites the URL
 * structure and the proxy matcher two phases after `src/proxy.test.ts` pinned
 * them, and the branch on entity reappears inside every query.
 */
export default async function ProducerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const producer = await findProducer(id);

  if (!producer) notFound();

  const [movements, forTotals] = await Promise.all([
    listRecentMovementsFor(Direction.INBOUND, producer.id),
    listMovementsForCounterpartyTotals(Direction.INBOUND, producer.id),
  ]);

  return (
    <ReferenceDetail
      name={producer.name}
      description="Inbound movements record the feedstock that came from this producer."
      editPath={`/producers/${producer.id}/edit`}
      archiveDescription="It stops appearing in the producers list and in the inbound movement dropdown. Its record and its movement history stay intact, and nothing is deleted."
      confirmLabel="Archive producer"
      archive={archiveProducer.bind(null, producer.id)}
      totalKg={totalInboundKg(forTotals)}
      totalLabel="Total inbound"
      movements={movements}
      seeAllHref={filterHref(NO_FILTERS, { producerId: producer.id })}
      noMovementsMessage="No feedstock has been recorded from this producer yet."
    />
  );
}
