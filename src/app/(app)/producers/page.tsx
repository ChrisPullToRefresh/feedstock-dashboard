import { Suspense } from "react";

import { ProducerList, ProducerListHeader } from "@/components/producer-list";
import { ProducerToast } from "@/components/producer-toast";
import { listActiveProducers } from "@/lib/producer-queries";

export default async function ProducersPage() {
  const producers = await listActiveProducers();

  return (
    <section className="mx-auto max-w-3xl">
      {/* Reads the search parameters the actions redirect with, which Next
          requires a boundary around. It renders nothing. */}
      <Suspense>
        <ProducerToast />
      </Suspense>
      <ProducerListHeader />
      <ProducerList producers={producers} />
    </section>
  );
}
