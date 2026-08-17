import { notFound } from "next/navigation";

import { renameProducer, restoreProducer } from "@/app/(app)/producers/actions";
import { ReferenceForm } from "@/components/reference-form";
import { findProducer } from "@/lib/producer-queries";
import { PRODUCER_SINGULAR } from "@/lib/reference-data";

export default async function EditProducerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const producer = await findProducer(id);

  // Includes an archived producer reached by its id. Nothing links there, but
  // a stale tab or a bookmark can, and editing one is harmless.
  if (!producer) notFound();

  return (
    <section className="mx-auto max-w-lg">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">
        Edit producer
      </h1>
      <ReferenceForm
        singular={PRODUCER_SINGULAR}
        // Bound rather than passed through a hidden field: the id decides which
        // row is written, so it must not be something the browser can change.
        action={renameProducer.bind(null, producer.id)}
        defaultName={producer.name}
        restore={restoreProducer}
        submitLabel="Save changes"
      />
    </section>
  );
}
