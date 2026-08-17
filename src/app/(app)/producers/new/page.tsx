import { createProducer, restoreProducer } from "@/app/(app)/producers/actions";
import { ReferenceForm } from "@/components/reference-form";
import { PRODUCER_SINGULAR } from "@/lib/reference-data";

export default function NewProducerPage() {
  return (
    <section className="mx-auto max-w-lg">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">
        Add producer
      </h1>
      <ReferenceForm
        singular={PRODUCER_SINGULAR}
        action={createProducer}
        restore={restoreProducer}
        submitLabel="Create producer"
      />
    </section>
  );
}
