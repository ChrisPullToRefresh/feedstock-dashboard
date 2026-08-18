import { Factory } from "lucide-react";

import { recordInboundMovement } from "@/app/(app)/record/actions";
import { CounterpartyEmpty } from "@/components/counterparty-empty";
import { MovementForm } from "@/components/movement-form";
import { Direction } from "@/generated/prisma/enums";
import { listActiveProducers } from "@/lib/producer-queries";

/**
 * Rendered per request, never prerendered.
 *
 * `specs/2026-08-16-sequestration-sites/plan.md` § Decisions binds this forward
 * to Phase 5 by name: a Server Component awaiting a database query with no
 * dynamic API is prerendered, so `next build` would bake whichever producers
 * existed at build time into the dropdown. Nothing here calls
 * `revalidatePath`, and `vercel-build` runs before any seeding, so the list
 * would be wrong in exactly the way an operator cannot diagnose.
 */
export const dynamic = "force-dynamic";

export default async function RecordInboundPage() {
  const producers = await listActiveProducers();

  return (
    <section className="mx-auto max-w-lg">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">
        Feedstock in
      </h1>
      {producers.length === 0 ? (
        <CounterpartyEmpty
          icon={Factory}
          title="No producers yet"
          description="Feedstock comes in from a producer, so there is nothing to record against yet. Add one and it becomes available here."
          actionLabel="Add the first producer"
          createPath="/producers/new"
        />
      ) : (
        <MovementForm
          direction={Direction.INBOUND}
          // Narrowed to what the dropdown shows. The rest of the row — the
          // timestamps especially — would otherwise be serialized into the
          // client payload of a form meant to load fast in a yard.
          options={producers.map(({ id, name }) => ({ id, name }))}
          action={recordInboundMovement}
          submitLabel="Record feedstock in"
        />
      )}
    </section>
  );
}
