import { Warehouse } from "lucide-react";

import { recordOutboundMovement } from "@/app/(app)/record/actions";
import { CounterpartyEmpty } from "@/components/counterparty-empty";
import { MovementForm } from "@/components/movement-form";
import { Direction } from "@/generated/prisma/enums";
import { listActiveSites } from "@/lib/site-queries";

/** Per request, for the reason given in the inbound route. */
export const dynamic = "force-dynamic";

export default async function RecordOutboundPage() {
  const sites = await listActiveSites();

  return (
    <section className="mx-auto max-w-lg">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">
        Feedstock out
      </h1>
      {sites.length === 0 ? (
        <CounterpartyEmpty
          icon={Warehouse}
          title="No sequestration sites yet"
          description="Feedstock goes out to a sequestration site, so there is nowhere to record it going yet. Add one and it becomes available here."
          actionLabel="Add the first sequestration site"
          createPath="/sites/new"
        />
      ) : (
        <MovementForm
          direction={Direction.OUTBOUND}
          options={sites.map(({ id, name }) => ({ id, name }))}
          action={recordOutboundMovement}
          submitLabel="Record feedstock out"
        />
      )}
    </section>
  );
}
