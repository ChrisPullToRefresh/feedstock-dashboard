import { recordOutboundMovement } from "@/app/(app)/record/actions";
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
      <MovementForm
        direction={Direction.OUTBOUND}
        options={sites.map(({ id, name }) => ({ id, name }))}
        action={recordOutboundMovement}
        submitLabel="Record feedstock out"
      />
    </section>
  );
}
