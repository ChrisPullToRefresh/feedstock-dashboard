import { Warehouse } from "lucide-react";
import { Suspense } from "react";

import {
  ReferenceList,
  ReferenceListHeader,
} from "@/components/reference-list";
import { ReferenceToast } from "@/components/reference-toast";
import { listActiveSites } from "@/lib/site-queries";

/**
 * The route stays `/sites` and the nav label stays "Sites", both shipped in
 * Phase 0. The words on the screen say "sequestration site", the term
 * `specs/mission.md` uses — `plan.md` § Decisions.
 */
export default async function SitesPage() {
  const sites = await listActiveSites();

  return (
    <section className="mx-auto max-w-3xl">
      {/* Reads the search parameters the actions redirect with, which Next
          requires a boundary around. It renders nothing. */}
      <Suspense>
        <ReferenceToast listPath="/sites" />
      </Suspense>
      <ReferenceListHeader
        heading="Sequestration sites"
        createPath="/sites/new"
        createLabel="Add sequestration site"
      />
      <ReferenceList
        items={sites}
        basePath="/sites"
        createPath="/sites/new"
        emptyIcon={Warehouse}
        emptyTitle="No sequestration sites yet"
        emptyDescription="Sequestration sites are where outbound movements go. Add one and it becomes available when recording an outbound movement."
        emptyActionLabel="Add the first sequestration site"
      />
    </section>
  );
}
