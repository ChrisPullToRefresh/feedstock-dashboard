import { notFound } from "next/navigation";

import { archiveSite } from "@/app/(app)/sites/actions";
import { ReferenceDetail } from "@/components/reference-detail";
import { Direction } from "@/generated/prisma/enums";
import { filterHref, NO_FILTERS } from "@/lib/movement-data";
import {
  listMovementsForCounterpartyTotals,
  listRecentMovementsFor,
} from "@/lib/movement-queries";
import { findSite } from "@/lib/site-queries";
import { totalOutboundKg } from "@/lib/totals";

/**
 * A sequestration site's page. The mirror of `/producers/[id]` — same
 * structure, its own query, its own archive action and its own words, none of
 * it duplicated markup.
 */
export default async function SitePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const site = await findSite(id);

  if (!site) notFound();

  const [movements, forTotals] = await Promise.all([
    listRecentMovementsFor(Direction.OUTBOUND, site.id),
    listMovementsForCounterpartyTotals(Direction.OUTBOUND, site.id),
  ]);

  return (
    <ReferenceDetail
      name={site.name}
      description="Outbound movements record the processed feedstock that went to this sequestration site."
      editPath={`/sites/${site.id}/edit`}
      archiveDescription="It stops appearing in the sequestration sites list and in the outbound movement dropdown. Its record and its movement history stay intact, and nothing is deleted."
      confirmLabel="Archive sequestration site"
      archive={archiveSite.bind(null, site.id)}
      totalKg={totalOutboundKg(forTotals)}
      totalLabel="Total outbound"
      movements={movements}
      seeAllHref={filterHref(NO_FILTERS, { sequestrationSiteId: site.id })}
      noMovementsMessage="No feedstock has been recorded to this sequestration site yet."
    />
  );
}
