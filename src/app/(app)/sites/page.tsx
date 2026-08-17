import { Warehouse } from "lucide-react";
import { Suspense } from "react";

import {
  ReferenceList,
  ReferenceListHeader,
} from "@/components/reference-list";
import { ReferenceToast } from "@/components/reference-toast";
import { listActiveSites } from "@/lib/site-queries";

/**
 * Rendered per request, never prerendered.
 *
 * Without this the page is static: `next build` runs `listActiveSites()` and
 * bakes the rows it finds into `sites.html`. Only the Server Actions call
 * `revalidatePath("/sites")`, so a write that does not go through one is never
 * reflected — and `vercel-build` is `prisma migrate deploy && next build`,
 * while seeding is a separate `npm run seed`. On a freshly seeded database the
 * build would prerender the empty state and the list would keep offering "Add
 * the first sequestration site" while `/sites/new` refused every seeded name as
 * already taken. It also made the build itself depend on the database being
 * reachable.
 *
 * `specs/tech-stack.md` pins no rendering strategy, and this list is small and
 * read by authenticated staff only, so a query per request is the right trade.
 */
export const dynamic = "force-dynamic";

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
