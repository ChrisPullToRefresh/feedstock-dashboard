import { Factory } from "lucide-react";
import { Suspense } from "react";

import {
  ReferenceList,
  ReferenceListHeader,
} from "@/components/reference-list";
import { ReferenceToast } from "@/components/reference-toast";
import { listActiveProducers } from "@/lib/producer-queries";

export default async function ProducersPage() {
  const producers = await listActiveProducers();

  return (
    <section className="mx-auto max-w-3xl">
      {/* Reads the search parameters the actions redirect with, which Next
          requires a boundary around. It renders nothing. */}
      <Suspense>
        <ReferenceToast listPath="/producers" />
      </Suspense>
      <ReferenceListHeader
        heading="Producers"
        createPath="/producers/new"
        createLabel="Add producer"
      />
      <ReferenceList
        items={producers}
        basePath="/producers"
        createPath="/producers/new"
        emptyIcon={Factory}
        emptyTitle="No producers yet"
        emptyDescription="Feedstock producers are who inbound movements come from. Add one and it becomes available when recording an inbound movement."
        emptyActionLabel="Add the first producer"
      />
    </section>
  );
}
