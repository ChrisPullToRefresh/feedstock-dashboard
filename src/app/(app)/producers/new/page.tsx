import { createProducer, restoreProducer } from "@/app/(app)/producers/actions";
import { ProducerForm } from "@/components/producer-form";

export default function NewProducerPage() {
  return (
    <section className="mx-auto max-w-lg">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">
        Add producer
      </h1>
      <ProducerForm
        action={createProducer}
        restore={restoreProducer}
        submitLabel="Create producer"
      />
    </section>
  );
}
