import { ProducerList, ProducerListHeader } from "@/components/producer-list";
import { listActiveProducers } from "@/lib/producers";

export default async function ProducersPage() {
  const producers = await listActiveProducers();

  return (
    <section className="mx-auto max-w-3xl">
      <ProducerListHeader />
      <ProducerList producers={producers} />
    </section>
  );
}
