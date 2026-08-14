import { Pencil } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { archiveProducer } from "@/app/(app)/producers/actions";
import { ArchiveProducerDialog } from "@/components/archive-producer-dialog";
import { Button } from "@/components/ui/button";
import { findProducer } from "@/lib/producer-queries";

export default async function ProducerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const producer = await findProducer(id);

  if (!producer) notFound();

  return (
    <section className="mx-auto max-w-lg">
      <h1 className="text-2xl font-semibold tracking-tight">{producer.name}</h1>
      <p className="text-muted-foreground mt-2 text-sm">
        Inbound movements record the feedstock that came from this producer.
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Button asChild variant="outline">
          <Link href={`/producers/${producer.id}/edit`}>
            <Pencil />
            Edit
          </Link>
        </Button>

        <ArchiveProducerDialog
          producerName={producer.name}
          archive={archiveProducer.bind(null, producer.id)}
        />
      </div>
    </section>
  );
}
