import { Pencil } from "lucide-react";
import Link from "next/link";

import { ArchiveDialog } from "@/components/archive-dialog";
import { MovementList } from "@/components/movement-list";
import { Button } from "@/components/ui/button";
import type { Prisma } from "@/generated/prisma/client";
import type { ListedMovement } from "@/lib/movement-queries";
import { formatWeightKg } from "@/lib/weight";

/**
 * A producer's or a sequestration site's detail page.
 *
 * `/producers/[id]` and `/sites/[id]` were near-identical and differed in five
 * things — the query, the archive action, one sentence of description, the
 * edit path and the confirm label. `specs/roadmap.md` Phase 6 asks for the
 * extraction *before* totals are rendered into either page, so the same block
 * is not built twice. Phase 4 generalized the form, the list, the archive
 * dialog and the toast and stopped one short of this one.
 *
 * The props are individual rather than a per-entity config object, because
 * Phase 4 chose that deliberately — "so the words stay next to the screen they
 * appear on" — and this phase is not where that gets reversed. A single
 * dynamic `/[entity]/[id]` route was declined: it rewrites the URL structure
 * and the proxy matcher two phases after `src/proxy.test.ts` pinned them, and
 * the branch on entity reappears inside every query.
 *
 * The cost accepted: six props at each call site.
 */
export function ReferenceDetail({
  name,
  description,
  editPath,
  archiveDescription,
  confirmLabel,
  archive,
  totalKg,
  totalLabel,
  movements,
  seeAllHref,
  noMovementsMessage,
}: {
  name: string;
  /** What movements against this counterparty mean, in its own words. */
  description: string;
  editPath: string;
  /** What archiving does, in this entity's terms. Which dropdown a row leaves
   * is the one thing that genuinely differs, which is why `ArchiveDialog` has
   * taken this from its caller since Phase 4. */
  archiveDescription: string;
  /** The archive dialog's confirm label, named for what it does. */
  confirmLabel: string;
  /** A Server Action already bound to this row's id. */
  archive: () => Promise<void>;
  /** This counterparty's whole history, not the rows listed below it. */
  totalKg: Prisma.Decimal;
  /** What the figure is — "Total inbound", "Total outbound". */
  totalLabel: string;
  /** The newest ten. The rest are behind See all. */
  movements: readonly ListedMovement[];
  /** The movement list, already filtered to this counterparty. */
  seeAllHref: string;
  noMovementsMessage: string;
}) {
  return (
    <section className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-semibold tracking-tight">{name}</h1>
      <p className="text-muted-foreground mt-2 text-sm">{description}</p>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Button asChild variant="outline">
          <Link href={editPath}>
            <Pencil />
            Edit
          </Link>
        </Button>

        <ArchiveDialog
          name={name}
          description={archiveDescription}
          confirmLabel={confirmLabel}
          archive={archive}
        />
      </div>

      <div className="mt-8 rounded-lg border p-4">
        <div className="text-muted-foreground text-sm">{totalLabel}</div>
        <div className="mt-1 text-2xl font-semibold tabular-nums">
          {formatWeightKg(totalKg)} kg
        </div>
      </div>

      <div className="mt-8">
        <div className="mb-3 flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold tracking-tight">
            Recent movements
          </h2>
          {/* Only when there is something to see. The movement list resolves a
              counterparty id against the counterparties that have movements —
              a filter has to be able to reach every name in the table, and no
              further — so a counterparty with none is not one it can filter
              to, and this link would quietly widen to the whole facility. */}
          {movements.length === 0 ? null : (
            <Button asChild variant="ghost">
              <Link href={seeAllHref}>See all</Link>
            </Button>
          )}
        </div>

        {movements.length === 0 ? (
          // An explanation rather than an empty table, which would read as a
          // list that failed to load.
          <p className="text-muted-foreground text-sm">{noMovementsMessage}</p>
        ) : (
          <MovementList movements={movements} />
        )}
      </div>
    </section>
  );
}
